/*
    Copyright (C) 2014  PencilBlue, LLC

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

//dependencies
var xml2js         = pb.PluginService.require('wp_import', 'xml2js');
var BaseController = pb.BaseController;

/**
 *
 *
 */
function WPXMLParseService() {}

//constants
/**
 * The absolute file path to the directory that stores media
 * @private
 * @static
 * @property MEDIA_DIRECTORY
 * @type {String}
 */
var MEDIA_DIRECTORY = path.join(DOCUMENT_ROOT, '/public/media/');

/**
 * @static
 * @method init
 */
WPXMLParseService.init = function(cb) {
    if(!fs.existsSync(MEDIA_DIRECTORY)){
        fs.mkdirSync(MEDIA_DIRECTORY);
    }

    pb.log.debug("WPXMLParseService: Initialized");
    cb(null, true);
};

WPXMLParseService.parse = function(xmlString, defaultUserId, cb) {
    var self = this;
    pb.log.debug('WPXMLParseService: Starting to parse...');
    
    xml2js.parseString(xmlString, function(err, wpData) {
        if(err) {
            cb('^loc_INVALID_XML^');
            return;
        }

        var channel = wpData.rss.channel[0];

        self.saveNewUsers(channel, function(users){
            self.saveNewTopics(channel, function(topics) {
                self.saveNewArticlesAndPages(defaultUserId, channel, users, topics, function(articles, pages, media) {
                    cb(null, users);
                });
            });
        });
    });
};

WPXMLParseService.saveNewUsers = function(channel, cb) {
    var self = this;
    var users = [];
    var dao = new pb.DAO();

    pb.log.debug('WPXMLParseService: Parsing Users...');
    
    this.checkForExistingUser = function(index) {
        if(index >= users.length) {
            cb(users);
            return;
        }

        dao.loadByValue('username', users[index].username, 'user', function(err, existingUser) {
            if(existingUser) {
                pb.log.debug('WPXMLParseService: User [%s] already exists', users[index].username);
                
                users[index] = existingUser;
                delete users[index].password;

                index++;
                self.checkForExistingUser(index);
                return;
            }

            var generatedPassword = self.generatePassword();

            users[index].email = 'user_' + pb.utils.uniqueId() + '@placeholder.com';
            users[index].admin = ACCESS_WRITER;
            users[index].password = generatedPassword;

            var newUser = pb.DocumentCreator.create('user', users[index]);
            dao.update(newUser).then(function(result) {
                
                pb.log.debug('WPXMLParseService: Created user [%s]', users[index].username);
                delete users[index].password;
                users[index].generatedPassword = generatedPassword;
                users[index]._id = result._id;

                index++;
                self.checkForExistingUser(index);
            });
        });
    };

    pb.plugins.getSetting('create_new_users', 'wp_import', function(err, createNewUsers) {
        if(createNewUsers && util.isArray(channel.item)) {
            for(var i = 0; i < channel.item.length; i++) {
                for(var j = 0; j < channel.item[i]['dc:creator'].length; j++) {
                    
                    var userMatch = false;
                    for(var s = 0; s < users.length; s++) {
                        if(users[s].username === channel.item[i]['dc:creator'][j]) {
                            userMatch = true;
                            break;
                        }
                    }
                    if(!userMatch) {
                        users.push({username: channel.item[i]['dc:creator'][j]});
                    }
                }
            }
        }

        self.checkForExistingUser(0);
    });
};

WPXMLParseService.saveNewTopics = function(channel, cb) {
    var self = this;
    var topics = [];
    var dao = new pb.DAO();

    pb.log.debug('WPXMLParseService: Parsing topics...');
    
    
    this.checkForExistingTopic = function(index) {
        if(index >= topics.length) {
            cb(topics);
            return;
        }

        dao.loadByValue('name', topics[index].name, 'topic', function(err, existingTopic) {
            if(existingTopic) {
                pb.log.debug('WPXMLParseService: Topic [%s] already exists', topics[index].name);
                topics[index] = existingTopic;

                index++;
                self.checkForExistingTopic(index);
                return;
            }

            topics[index].name = BaseController.sanitize(topics[index].name);
            var newTopic = pb.DocumentCreator.create('topic', topics[index]);
            dao.update(newTopic).then(function(result) {
                topics[index]._id = result._id;

                index++;
                self.checkForExistingTopic(index);
            });
        });
    };

    pb.log.silly('WPXMLParseService:Parsing Topics: Inspecting "wp:category" elements...');
    var categories = channel['wp:category'];
    if (util.isArray(categories)) {
        for(var i = 0; i < categories.length; i++) {
            for(var j = 0; j < categories[i]['wp:cat_name'].length; j++) {
                var topicMatch = false;
                for(var s = 0; s < topics.length; s++) {
                    if(categories[i]['wp:cat_name'][j] === topics[s]) {
                        topicMatch = true;
                        break;
                    }
                }

                if(!topicMatch && categories[i]['wp:cat_name'][j].toLowerCase() !== 'uncategorized') {
                    topics.push({name: categories[i]['wp:cat_name'][j]});
                }
            }
        }
    }

    pb.log.silly('WPXMLParseService:Parsing Topics: Inspecting "wp:tag" elements...');
    var tags = channel['wp:tag'];
    if (util.isArray(tags)) {
        for(var i = 0; i < tags.length; i++) {
            for(var j = 0; j < tags[i]['wp:tag_name'].length; j++) {
                var topicMatch = false;
                for(var s = 0; s < topics.length; s++) {
                    if(tags[i]['wp:tag_name'][j] === topics[s]) {
                        topicMatch = true;
                        break;
                    }
                }

                if(!topicMatch) {
                    topics.push({name: tags[i]['wp:tag_name'][j]});
                }
            }
        }
    }

    self.checkForExistingTopic(0);
};

WPXMLParseService.saveNewArticlesAndPages = function(defaultUserId, channel, users, topics, cb) {
    var self = this;
    var rawArticles = [];
    var rawPages = [];
    var articles = [];
    var pages = [];
    var media = [];
    var dao = new pb.DAO();

    pb.log.debug('WPXMLParseService:Parsing Articles and Pages...');
    
    
    this.checkForExistingPage = function(index) {
        if(index >= rawPages.length) {
            self.checkForExistingArticle(0);
            return;
        }

        var rawPage = rawPages[index];
        dao.loadByValue('url', rawPage['wp:post_name'][0], 'page', function(err, existingPage) {
            if(existingPage) {
                pages.push(existingPage);
                index++;
                self.checkForExistingPage(index);
                return;
            }

            var pageTopics = [];
            rawPage.category = rawPage.category || [];
            for(var i = 0; i < rawPage.category.length; i++) {
                if(pb.utils.isString(rawPage.category[i])) {
                    for(var j = 0; j < topics.length; j++) {
                        if(topics[j].name == rawPage.category[i]) {
                            pageTopics.push(topics[j]._id.toString());
                        }
                    }
                }
            }

            self.retrieveMediaObjects(rawPage['content:encoded'][0], function(updatedContent, mediaObjects) {
                updatedContent = updatedContent.split("\r\n").join("<br/>");

                var pageMedia = [];
                for(var i = 0; i < mediaObjects.length; i++) {
                    pageMedia.push(mediaObjects[i]._id.toString());
                }
                self.addMedia(mediaObjects);

                var pagedoc = {
                    url: rawPage['wp:post_name'][0],
                    headline: BaseController.sanitize(rawPage.title[0]),
                    publish_date: new Date(rawPage['wp:post_date'][0]),
                    page_layout: BaseController.sanitize(updatedContent, BaseController.getContentSanitizationRules()),
                    page_topics: pageTopics,
                    page_media: pageMedia,
                    seo_title: BaseController.sanitize(rawPage.title[0]),
                    author: defaultUserId
                }
                var newPage = pb.DocumentCreator.create('page', pagedoc);
                dao.update(newPage).then(function(result) {
                    pages.push(result);

                    index++;
                    self.checkForExistingPage(index);
                });
            });
        });
    };

    this.checkForExistingArticle = function(index) {
        if(index >= rawArticles.length) {
            cb(articles, pages, media);
            return;
        }

        var rawArticle = rawArticles[index];
        dao.loadByValue('url', rawArticle['wp:post_name'][0], 'article', function(err, existingArticle) {
            if(existingArticle) {
                articles.push(existingArticle);
                index++;
                self.checkForExistingArticle(index);
                return;
            }

            var articleTopics = [];
            if (util.isArray(rawArticle.category)) {
                for(var i = 0; i < rawArticle.category.length; i++) {
                    if(pb.utils.isString(rawArticle.category[i])) {
                        for(var j = 0; j < topics.length; j++) {
                            if(topics[j].name == rawArticle.category[i]) {
                                articleTopics.push(topics[j]._id.toString());
                            }
                        }
                    }
                }
            }

            var authorUsername = rawArticle['dc:creator'][0];
            var author;
            for(i = 0; i < users.length; i++) {
                if(users[i].username === authorUsername) {
                    author = users[i]._id.toString();
                }
            }
            if(!author) {
                author = defaultUserId;
            }

            pb.log.debug('WPXMLParseService: Retrieving media for [%s]...', rawArticle.title[0]);
            self.retrieveMediaObjects(rawArticle['content:encoded'][0], function(updatedContent, mediaObjects) {
                updatedContent = updatedContent.split("\r\n").join("<br/>");
                var articleMedia = [];
                for(var i = 0; i < mediaObjects.length; i++) {
                    articleMedia.push(mediaObjects[i]._id.toString());
                }
                self.addMedia(mediaObjects);

                var articleDoc = {
                    url: rawArticle['wp:post_name'][0],
                    headline: BaseController.sanitize(rawArticle.title[0]),
                    publish_date: new Date(rawArticle['wp:post_date'][0]),
                    article_layout: BaseController.sanitize(updatedContent, BaseController.getContentSanitizationRules()),
                    article_topics: articleTopics,
                    article_sections: [],
                    article_media: articleMedia,
                    seo_title: BaseController.sanitize(rawArticle.title[0]),
                    author: author
                };
                var newArticle = pb.DocumentCreator.create('article', articleDoc);
                dao.update(newArticle).then(function(result) {
                    articles.push(result);

                    index++;
                    self.checkForExistingArticle(index);
                });
            });
        });
    };

    this.addMedia = function(mediaObjects) {
        for(var i = 0; i < mediaObjects.length; i++) {
            var mediaMatch = false;
            for(var j = 0; j < media.length; j++) {
                if(media[j]._id.equals(mediaObjects[i]._id)) {
                    mediaMatch = true;
                    break;
                }
            }

            if(!mediaMatch) {
                media.push(mediaObjects[i]);
            }
        }
    };

    var items = channel.item;
    for(var i = 0; i < items.length; i++) {
        
        var postType = items[i]['wp:post_type']
        if (postType) {
            
            if(postType[0] === 'page') {
                rawPages.push(items[i]);
            }
            else if(postType[0] === 'post') {
                rawArticles.push(items[i]);
            }
        }
    }

    self.checkForExistingPage(0);
};

WPXMLParseService.retrieveMediaObjects = function(content, cb) {
    var https = require('https');
    var self = this;
    var mediaObjects = [];
    var dao = new pb.DAO();

    pb.plugins.getSetting('download_media', 'wp_import', function(err, downloadMedia) {
        self.replaceMediaObject = function() {
            var startIndex = content.indexOf('<img');
            var mediaType = 'image';
            if(startIndex === -1) {
                self.checkForVideo();
                return;
            }


            var endIndex1 = content.substr(startIndex).indexOf('/>');
            var endIndex2 = content.substr(startIndex).indexOf('/img>');
            var endIndex3 = content.substr(startIndex).indexOf('>');
            var endIndex;

            if(endIndex1 > -1 && endIndex1 < endIndex2) {
                endIndex = endIndex1 + 2;
            }
            else if(endIndex2 > -1) {
                endIndex = endIndex2 + 4;
            }
            else {
                endIndex = endIndex3 + 1;
            }

            var mediaString = content.substr(startIndex, endIndex);
            var srcString = mediaString.substr(mediaString.indexOf('src="') + 5);
            srcString = srcString.substr(0, srcString.indexOf('"'));
            if(srcString.indexOf('?') > -1) {
                srcString = srcString.substr(0, srcString.indexOf('?'));
            }

            if(downloadMedia && mediaType === 'image') {
                var ht = http;
                if(srcString.indexOf('https://') > -1) {
                    ht = https;
                }

                ht.get(srcString, function(res) {
                    var imageData = '';
                    res.setEncoding('binary');

                    res.on('data', function(chunk){
                        imageData += chunk;
                    })
                    .once('end', function(){
                        self.saveDownloadedImage(srcString, imageData, function(location) {
                            self.saveMediaObject(mediaType, location, function(mediaObject) {
                                content = content.split(mediaString).join('^media_display_' + mediaObject._id.toString() + '/position:center^');
                                self.replaceMediaObject();
                            });
                        });
                    })
                    .once('error', function(err) {
                        pb.log.error('WPXMLParseService: Failed to download media [%s]: %s', srcString, err.stack);
                        self.saveMediaObject(mediaType, srcString, function(mediaObject) {
                            content = content.split(mediaString).join('^media_display_' + mediaObject._id.toString() + '/position:center^');
                            self.replaceMediaObject();
                        });
                    });
                });
            }
            else {
                self.saveMediaObject(mediaType, srcString, function(mediaObject) {
                    content = content.split(mediaString).join('^media_display_' + mediaObject._id.toString() + '/position:center^');
                    self.replaceMediaObject();
                });
            }
        };

        self.checkForVideo = function() {
            var startIndex;
            var endIndex;
            var mediaString;
            var location;

            if(content.indexOf('[youtube=') > -1) {
                startIndex = content.indexOf('[youtube=');
                endIndex = content.substr(startIndex).indexOf(']') + 1;
                mediaString = content.substr(startIndex, endIndex);
                location = mediaString.substr(mediaString.indexOf('?v=') + 3, mediaString.substr(mediaString.indexOf('?v=') + 3).length - 1);

                self.saveMediaObject('youtube', location, function(mediaObject) {
                    content = content.split(mediaString).join('^media_display_' + mediaObject._id.toString() + '/position:center^');
                    self.checkForVideo();
                });
            }
            else if(content.indexOf('[dailymotion') > -1) {
                startIndex = content.indexOf('[dailymotion');
                endIndex = content.substr(startIndex).indexOf(']') + 1;
                mediaString = content.substr(startIndex, endIndex);
                location = mediaString.substr(mediaString.indexOf('id=') + 3, mediaString.substr(mediaString.indexOf('id=') + 3).length - 1);

                self.saveMediaObject('daily_motion', location, function(mediaObject) {
                    content = content.split(mediaString).join('^media_display_' + mediaObject._id.toString() + '/position:center^');
                    self.checkForVideo();
                });
            }
            else {
                cb(content, mediaObjects);
            }
        };

        self.saveDownloadedImage = function(originalFilename, imageData, cb) {
            var self  = this;

            var date = new Date();
            var monthDir = MEDIA_DIRECTORY + date.getFullYear() + '/';
            if(!fs.existsSync(monthDir)) {
                fs.mkdirSync(monthDir);
            }

            var uploadDirectory = monthDir + (date.getMonth() + 1) + '/';
            if(!fs.existsSync(uploadDirectory)) {
                fs.mkdirSync(uploadDirectory);
            }

            filename = self.generateFilename(originalFilename);
            filePath = uploadDirectory + filename;

            fs.writeFile(filePath, imageData, 'binary', function(err) {
                cb('/media/' + date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + filename);
            });
        };

        self.saveMediaObject = function(mediaType, location, cb) {
            dao.loadByValue('location', location, 'media', function(err, existingMedia) {
                if(existingMedia) {
                    mediaObjects.push(existingMedia);
                    cb(existingMedia);
                    return;
                }

                var isFile = null;
                if(location.indexOf('/media') === 0) {
                    isFile = 'on';
                }

                var mediadoc = {
                    is_file: isFile,
                    media_type: mediaType,
                    location: location,
                    thumb: location,
                    name: 'Media_' + pb.utils.uniqueId(),
                    caption: '',
                    media_topics: []
                };
                var newMedia = pb.DocumentCreator.create('media', mediadoc);
                dao.update(newMedia).then(function(result) {
                    mediaObjects.push(result);
                    cb(result);
                });
            });
        };

        self.generateFilename = function(originalFilename){
            var now = new Date();

            //calculate extension
            var ext = '';
            var extIndex = originalFilename.lastIndexOf('.');
            if (extIndex >= 0){
                ext = originalFilename.substr(extIndex);
            }

            //build file name
            return pb.utils.uniqueId() + '-' + now.getTime() + ext;
        };

        self.replaceMediaObject();
    });
};

WPXMLParseService.generatePassword = function() {
    return pb.security.generatePassword(8);
};

//exports
module.exports = WPXMLParseService;
