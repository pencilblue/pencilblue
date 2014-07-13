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

/**
 * Imports a CSV of topics
 */

function ImportWP(){}

//setup
var MEDIA_DIRECTORY = DOCUMENT_ROOT + '/public/media/';
if(!fs.existsSync(MEDIA_DIRECTORY)){
    fs.mkdirSync(MEDIA_DIRECTORY);
}

//inheritance
util.inherits(ImportWP, pb.BaseController);

ImportWP.prototype.render = function(cb) {
    var self  = this;
    var files = [];

    var form = new formidable.IncomingForm();
    form.on('file', function(field, file)
    {
        files.push(file);
    });
    form.parse(this.req, function() {
        //TODO handle error, max size, etc.
        fs.readFile(files[0].path, function(err, data) {
            if(util.isError(err)) {
                self.session.error = '^loc_NO_FILE^';
                cb({content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, 'No file provided')});
                return;
            }

            var parseString = require('xml2js').parseString;
            parseString(data.toString(), function(err, wpData) {
                if(err) {
                    self.session.error = '^loc_INVALID_XML^';
                    cb({content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, 'Not a valid XML file')});
                    return;
                }

                var channel = wpData.rss.channel[0];

                self.saveNewUsers(channel, function(users){
                    self.saveNewTopics(channel, function(topics) {
                        self.saveNewArticlesAndPages(channel, users, topics, function(articles, pages, media) {
                            self.session.success = '^loc_WP_IMPORT_SUCCESS^';
                            cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, 'Successfully imported WordPress content')});
                        });
                    });
                });
            });
        });
    });
};

ImportWP.prototype.saveNewUsers = function(channel, cb) {
    var self = this;
    var users = [];
    var dao = new pb.DAO();

    this.checkForExistingUser = function(index) {
        if(index >= users.length) {
            cb(users);
            return;
        }

        dao.loadByValue('username', users[index].username, 'user', function(err, existingUser) {
            if(existingUser) {
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
                delete users[index].password;
                users[index].generatedPassword = generatedPassword;
                users[index]._id = result._id;

                index++;
                self.checkForExistingUser(index);
            });
        });
    };

    pb.plugins.getSetting('create_new_users', 'wp_import', function(err, createNewUsers) {
        if(createNewUsers) {
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

ImportWP.prototype.saveNewTopics = function(channel, cb) {
    var self = this;
    var topics = [];
    var dao = new pb.DAO();

    this.checkForExistingTopic = function(index) {
        if(index >= topics.length) {
            cb(topics);
            return;
        }

        dao.loadByValue('name', topics[index].name, 'topic', function(err, existingTopic) {
            if(existingTopic) {
                topics[index] = existingTopic;

                index++;
                self.checkForExistingTopic(index);
                return;
            }

            var newTopic = pb.DocumentCreator.create('topic', topics[index]);
            dao.update(newTopic).then(function(result) {
                topics[index]._id = result._id;

                index++;
                self.checkForExistingTopic(index);
            });
        });
    };

    var categories = channel['wp:category'];
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

    var tags = channel['wp:tag'];
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

    self.checkForExistingTopic(0);
};

ImportWP.prototype.saveNewArticlesAndPages = function(channel, users, topics, cb) {
    var self = this;
    var rawArticles = [];
    var rawPages = [];
    var articles = [];
    var pages = [];
    var media = [];
    var dao = new pb.DAO();

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
                if(typeof rawPage.category[i] === 'string') {
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

                var newPage = pb.DocumentCreator.create('page', {url: rawPage['wp:post_name'][0], headline: rawPage.title[0], publish_date: new Date(rawPage['wp:post_date'][0]), page_layout: updatedContent, page_topics: pageTopics, page_media: pageMedia, seo_title: rawPage.title[0], author: self.session.authentication.user_id});
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
            for(var i = 0; i < rawArticle.category.length; i++) {
                if(typeof rawArticle.category[i] === 'string') {
                    for(var j = 0; j < topics.length; j++) {
                        if(topics[j].name == rawArticle.category[i]) {
                            articleTopics.push(topics[j]._id.toString());
                        }
                    }
                }
            }

            var authorUsername = rawArticle['dc:creator'][0];
            var author;
            for(i = 0; i < users.length; i++) {
                if(users[i].username === authorUsername) {
                    author = users[i];
                }
            }

            self.retrieveMediaObjects(rawArticle['content:encoded'][0], function(updatedContent, mediaObjects) {
                updatedContent = updatedContent.split("\r\n").join("<br/>");
                var articleMedia = [];
                for(var i = 0; i < mediaObjects.length; i++) {
                    articleMedia.push(mediaObjects[i]._id.toString());
                }
                self.addMedia(mediaObjects);

                var newArticle = pb.DocumentCreator.create('article', {url: rawArticle['wp:post_name'][0], headline: rawArticle.title[0], publish_date: new Date(rawArticle['wp:post_date'][0]), article_layout: updatedContent, article_topics: articleTopics, article_sections: [], article_media: articleMedia, seo_title: rawArticle.title[0], author: author._id.toString()});
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
        if(items[i]['wp:post_type'][0] === 'page') {
            rawPages.push(items[i]);
        }
        else if(items[i]['wp:post_type'][0] === 'post') {
            rawArticles.push(items[i]);
        }
    }

    self.checkForExistingPage(0);
};

ImportWP.prototype.retrieveMediaObjects = function(content, cb) {
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
                    });

                    res.on('end', function(){
                        self.saveDownloadedImage(srcString, imageData, function(location) {
                            self.saveMediaObject(mediaType, location, function(mediaObject) {
                                content = content.split(mediaString).join('^media_display_' + mediaObject._id.toString() + '/position:center^');
                                self.replaceMediaObject();
                            });
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

                var newMedia = pb.DocumentCreator.create('media', {is_file: isFile, media_type: mediaType, location: location, thumb: location, name: 'Media_' + pb.utils.uniqueId(), caption: '', media_topics: []});
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

ImportWP.prototype.generatePassword = function()
{
    var characters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '!', '@', '#', '$', '%', '^', '&', '*', '?'];

    var password = '';
    while(password.length < 8)
    {
        password = password.concat(characters[parseInt(Math.random() * characters.length)]);
    }

    return password;
};

ImportWP.getRoutes = function(cb) {
    var routes = [
        {
            method: 'post',
            path: '/actions/admin/plugins/settings/wp_import/import',
            auth_required: true,
            access_level: ACCESS_EDITOR,
            content_type: 'text/html'
        }
    ];
    cb(null, routes);
};

//exports
module.exports = ImportWP;
