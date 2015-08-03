/*
    Copyright (C) 2015  PencilBlue, LLC

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
var process = require('process');
var async   = require('async');
var domain  = require('domain');

module.exports = function WPXMLParseServiceModule(pb) {
    
    //pb dependencies
    var util           = pb.util;
    var xml2js         = pb.PluginService.require('wp_import', 'xml2js');
    var BaseController = pb.BaseController;

    /**
     *
     * @class WPXMLParseService
     * @constructor
     */
    function WPXMLParseService(site) {
        this.site = pb.SiteService.getCurrentSite(site);
        this.siteQueryService = new pb.SiteQueryService({site: this.site, onlyThisSite: true});
    }
    
    /**
     * Counter used to help create a random values for required fields when no 
     * value is present
     * @private
     * @static
     * @property DEFAULT_COUNTER
     * @type {Integer}
     */
    var DEFAULT_COUNTER = 0;

    /**
     * The name the service
     * @private
     * @static
     * @readonly
     * @property SERVICE_NAME
     * @type {String}
     */
    var SERVICE_NAME = 'wp_xml_parse';

    /**
     * @static
     * @method init
     */
    WPXMLParseService.init = function(cb) {
        pb.log.debug("WPXMLParseService: Initialized");
        cb(null, true);
    };

    /**
     * A service interface function designed to allow developers to name the handle
     * to the service object what ever they desire. The function must return a
     * valid string and must not conflict with the names of other services for the
     * plugin that the service is associated with.
     *
     * @static
     * @method getName
     * @return {String} The service name
     */
    WPXMLParseService.getName = function() {
        return SERVICE_NAME;
    };

    WPXMLParseService.prototype.parse = function(xmlString, defaultUserId, cb) {
        var self = this;
        pb.log.debug('WPXMLParseService: Starting to parse...');

        xml2js.parseString(xmlString, function(err, wpData) {
            if(err) {
                return cb('^loc_INVALID_XML^');
            }

            var channel = wpData.rss.channel[0];

            var settings = null;
            var users = null;
            var topics = null;
            var tasks = [

                //load settings
                function(callback) {
                    var pluginService = new pb.PluginService({site: self.site});
                    pluginService.getSettingsKV('wp_import', function(err, settingsResult) {
                        settings = settingsResult;
                        callback(err);
                    });
                },

                function(callback) {
                    self.saveNewUsers(channel, settings, function(err, usersResult){
                        users = usersResult;
                        callback(err);
                    });
                },

                function(callback) {
                    self.saveNewTopics(channel, function(err, topicsResult) {
                        topics = topicsResult;
                        callback(err);
                    });
                },

                function(callback) {
                    self.saveNewArticlesAndPages(defaultUserId, channel, users, topics, settings, callback);
                }
            ];
            async.series(tasks, function(err, results) {
                cb(err, users);
            });
        });
    };

    WPXMLParseService.prototype.saveNewUsers = function(channel, settings, cb) {
        pb.log.debug('WPXMLParseService: Parsing Users...');

        var self = this;
        var users = [];
        var createNewUsers = settings.create_new_users;
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

        var tasks = util.getTasks(users, function(users, index) {
            return function(callback) {

                self.siteQueryService.loadByValue('username', users[index].username, 'user', function(err, existingUser) {
                    if (util.isError(err)) {
                        return cb(err);
                    }
                    else if(existingUser) {
                        pb.log.debug('WPXMLParseService: User [%s] already exists', users[index].username);

                        users[index] = existingUser;
                        delete users[index].password;
                        return callback(null, existingUser);
                    }

                    var generatedPassword = pb.security.generatePassword(8);

                    users[index].email = 'user_' + util.uniqueId() + '@placeholder.com';
                    users[index].admin = pb.SecurityService.ACCESS_WRITER;
                    users[index].password = generatedPassword;

                    var newUser = pb.DocumentCreator.create('user', users[index]);
                    self.siteQueryService.save(newUser, function(err, result) {
                        if (util.isError(err)) {
                            return callback(err);
                        }

                        pb.log.debug('WPXMLParseService: Created user [%s]', users[index].username);
                        delete users[index].password;
                        users[index].generatedPassword = generatedPassword;
                        users[index][pb.DAO.getIdField()] = result[pb.DAO.getIdField()];
                        callback(null, newUser);
                    });
                });
            };
        });
        async.series(tasks, cb);
    };

    WPXMLParseService.prototype.saveNewTopics = function(channel, cb) {
        var self = this;
        pb.log.debug('WPXMLParseService: Parsing topics...');

        //parse out the list of topics to try and persist
        var topics = {};
        var iterations = [
            {
                element: "wp:category",
                name: "wp:cat_name"
            },
            {
                element: "wp:tag",
                name: "wp:tag_name"
            }                      
        ];

        iterations.forEach(function(descriptor) {

            pb.log.silly('WPXMLParseService:Parsing Topics: Inspecting "%s" elements...', descriptor.element);

            //could also be tags. we treat them the same
            var categories = channel[descriptor.element];
            if (util.isArray(categories)) {

                //iterate over the categories
                for(var i = 0; i < categories.length; i++) {

                    //iterate over the individual items
                    for(var j = 0; j < categories[i][descriptor.name].length; j++) {

                        //get the topic name
                        var rawName = categories[i][descriptor.name][j];
                        var topicName = pb.BaseController.sanitize(rawName.trim());

                        //when it doesn't exist
                        var lower = topicName.toLowerCase();
                        if(!topics[lower] && lower !== 'uncategorized') {

                            topics[lower] = {
                                name: topicName
                            };
                        }
                    }
                }
            }
        });

        //persist each tag if it doesn't already exist
        var tasks = util.getTasks(Object.keys(topics), function(topicKeys, i) {
            return function(callback) {

                //get the topic formatted
                var topic = pb.DocumentCreator.create('topic', topics[topicKeys[i]]);
                //ensure it doesn't already exist
                var key = 'name';
                var val = new RegExp('^'+util.escapeRegExp(topic.name)+'$', 'ig');
                self.siteQueryService.loadByValue(key, val, 'topic', function(err, existingTopic) {
                    if (util.isError(err)) {
                        return callback(err);   
                    }
                    else if(existingTopic) {
                        pb.log.debug("WPXMLParseService: Topic %s already exists. Skipping", topic.name);
                        return callback(null, existingTopic);
                    }

                    //we're all good.  we can persist now
                    self.siteQueryService.save(topic, function(err, result) {
                        if (util.isError(err)) {
                            return callback(err);
                        }

                        pb.log.debug('WPXMLParseService: Created topic [%s]', topic.name);
                        callback(null, topic);
                    });
                });
            };
        });
        async.parallel(tasks, cb);
    };

    WPXMLParseService.prototype.saveNewArticlesAndPages = function(defaultUserId, channel, users, topics, settings, cb) {
        var self = this;
        var rawArticles = [];
        var rawPages = [];
        var articles = [];
        var pages = [];
        var media = [];


        pb.log.debug('WPXMLParseService: Parsing Articles and Pages...');

        //parse out the articles and pages
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
                else {
                    pb.log.debug('WPXMLParseService: Unrecognized post type [%s] found with title "%s"', postType[0], items[i].title ? items[i].title[0] : undefined);
                }
            }
        }


        //page tasks
        var pageTasks = util.getTasks(rawPages, function(rawPages, index) {
            return function(callback) {
                var rawPage = rawPages[index];
                var pageName = rawPage['wp:post_name'][0] || rawPage.title[0];

                //output progress
                pb.log.debug('WPXMLParseService: Processing %s "%s"', 'page', pageName);

                //check to see if the page already exists by URL
                var options = {
                    type: 'page',
                    url: pageName,
                };
                var urlService = new pb.UrlService(self.site, true);
                urlService.existsForType(options, function(err, exists) {
                    if (util.isError(err)) {
                        return callback(err);
                    }
                    else if (exists) {
                        pb.log.debug('A %s with this URL [%s] already exists.  Skipping', options.type, pageName);
                        return callback();
                    }

                    //look for associated topics
                    var pageTopics = [];
                    rawPage.category = rawPage.category || [];
                    for(var i = 0; i < rawPage.category.length; i++) {
                        if(util.isString(rawPage.category[i])) {
                            for(var j = 0; j < topics.length; j++) {
                                if(topics[j].name == rawPage.category[i]) {
                                    pageTopics.push(topics[j][pb.DAO.getIdField()].toString());
                                }
                            }
                        }
                    }

                    //retrieve media content for page
                    pb.log.debug('WPXMLParseService: Inspecting %s for media content', pageName);

                    self.retrieveMediaObjects(rawPage['content:encoded'][0], settings, function(err, updatedContent, mediaObjects) {
                        if (util.isError(err)) {
                            pb.log.error('WPXMLParseService: Failed to retrieve 1 or more media objects for %s. %s', options.type, err.stack);
                        }
                        updatedContent = updatedContent.split("\r\n").join("<br/>");

                        //create page media references
                        var pageMedia = [];
                        if (util.isArray(mediaObjects)) {
                            for(var i = 0; i < mediaObjects.length; i++) {
                                pageMedia.push(mediaObjects[i][pb.DAO.getIdField()].toString());
                            }
                        }

                        //construct the page descriptor
                        var title = BaseController.sanitize(rawPage.title[0]) || self.uniqueStrVal('Page');
                        var pagedoc = {
                            url: pageName,
                            headline: title,
                            publish_date: new Date(rawPage['wp:post_date'][0]),
                            page_layout: BaseController.sanitize(updatedContent, BaseController.getContentSanitizationRules()),
                            page_topics: pageTopics,
                            page_media: pageMedia,
                            seo_title: title,
                            author: defaultUserId
                        }
                        var newPage = pb.DocumentCreator.create('page', pagedoc);
                        self.siteQueryService.save(newPage, callback);
                    });
                });
            };
        });

        //article tasks
        var articleTasks = util.getTasks(rawArticles, function(rawArticles, index) {
            return function(callback) {
                var rawArticle = rawArticles[index];
                var articleName = rawArticle['wp:post_name'][0] || rawArticle.title[0];
                if (util.isNullOrUndefined(articleName) || articleName === '') {
                    articleName = self.uniqueStrVal('article');
                };

                //output progress
                pb.log.debug('WPXMLParseService: Processing %s "%s"', 'article', articleName);

                //check to see if the page already exists by URL
                var options = {
                    type: 'article',
                    url: articleName,
                };
                var urlService = new pb.UrlService(self.site, true);
                urlService.existsForType(options, function(err, exists) {
                    if (util.isError(err)) {
                        return callback(err);
                    }
                    else if (exists) {
                        pb.log.debug('A %s with this URL [%s] already exists.  Skipping', options.type, articleName);
                        return callback();
                    }

                    //look for associated topics
                    var articleTopics = [];
                    if (util.isArray(rawArticle.category)) {
                        for(var i = 0; i < rawArticle.category.length; i++) {
                            if(util.isString(rawArticle.category[i])) {
                                for(var j = 0; j < topics.length; j++) {
                                    if(topics[j].name == rawArticle.category[i]) {
                                        articleTopics.push(topics[j][pb.DAO.getIdField()].toString());
                                    }
                                }
                            }
                        }
                    }

                    //lookup author
                    var author;
                    var authorUsername = rawArticle['dc:creator'][0];
                    for(i = 0; i < users.length; i++) {
                        if(users[i].username === authorUsername) {
                            author = users[i][pb.DAO.getIdField()].toString();
                        }
                    }
                    if(!author) {
                        author = defaultUserId;
                    }

                    //retrieve media content for article
                    pb.log.debug('WPXMLParseService: Inspecting %s for media content', articleName);

                    self.retrieveMediaObjects(rawArticle['content:encoded'][0], settings, function(err, updatedContent, mediaObjects) {
                        if (util.isError(err)) {
                            pb.log.error('WPXMLParseService: Failed to retrieve 1 or more media objects for %s. %s', options.type, err.stack);
                        }
                        updatedContent = updatedContent.split("\r\n").join("<br/>");

                        //create page media references
                        var articleMedia = [];
                        if (util.isArray(mediaObjects)) {
                            for(var i = 0; i < mediaObjects.length; i++) {
                                articleMedia.push(mediaObjects[i][pb.DAO.getIdField()].toString());
                            }
                        }

                        //construct the article descriptor
                        var title = BaseController.sanitize(rawArticle.title[0]) || self.uniqueStrVal('Article');
                        var articleDoc = {
                            url: articleName,
                            headline: title,
                            publish_date: new Date(rawArticle['wp:post_date'][0]),
                            article_layout: BaseController.sanitize(updatedContent, BaseController.getContentSanitizationRules()),
                            article_topics: articleTopics,
                            article_sections: [],
                            article_media: articleMedia,
                            seo_title: title,
                            author: author
                        };
                        var newArticle = pb.DocumentCreator.create('article', articleDoc);
                        self.siteQueryService.save(newArticle, callback);
                    });
                });
            };
        });

        //create a super set of tasks and execute them 1 at a time
        var tasks = pageTasks.concat(articleTasks);
        pb.log.debug("WPXMLParseService: Now processing %d pages and %d articles.", pageTasks.length, articleTasks.length);
        async.series(tasks, cb);
    };

    WPXMLParseService.prototype.retrieveMediaObjects = function(content, settings, cb) {
        var self = this;
        var handlers = [
            {
                name: 'image',
                hasContent: function() {
                    return content.indexOf('<img') > -1;
                },
                getContentDetails: function() {
                    var startIndex = content.indexOf('<img');
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

                    return {
                        source: srcString,
                        replacement: mediaString
                    };
                },
                getMediaObject: function(details, cb) {
                    if(!settings.download_media) {
                        return self.createMediaObject('image', details.source, cb);
                    }

                    //download it & store it with the media service
                    self.downloadMediaContent(details.source, function(err, location) {
                        if (util.isError(err)) {
                            return cb(err);   
                        }

                        //create the media object
                        self.createMediaObject('image', location, cb);
                    });
                }
            },
            {
                name: 'youtube',
                hasContent: function() {
                    return content.indexOf('[youtube=') > -1;
                },
                getContentDetails: function() {
                    var startIndex = content.indexOf('[youtube=');
                    var endIndex = content.substr(startIndex).indexOf(']') + 1;
                    var mediaString = content.substr(startIndex, endIndex);
                    var location = mediaString.substr(mediaString.indexOf('?v=') + 3, mediaString.substr(mediaString.indexOf('?v=') + 3).length - 1);

                    return {
                        source: location,
                        replacement: mediaString
                    };
                },
                getMediaObject: function(details, cb) {
                    self.createMediaObject('youtube', details.source, cb);
                }
            },
            {
                name: 'daily_motion',
                hasContent: function() {
                    return content.indexOf('[dailymotion') > -1;
                },
                getContentDetails: function() {
                    var startIndex = content.indexOf('[dailymotion');
                    var endIndex = content.substr(startIndex).indexOf(']') + 1;
                    var mediaString = content.substr(startIndex, endIndex);
                    var location = mediaString.substr(mediaString.indexOf('id=') + 3, mediaString.substr(mediaString.indexOf('id=') + 3).length - 1);

                    return {
                        source: location,
                        replacement: mediaString
                    };
                },
                getMediaObject: function(details, cb) {
                    self.createMediaObject('daily_motion', details.source, cb);
                }
            }
        ];

        var handler;
        var mediaObjects = [];
        var whileFunc = function() {

            //reset the handler and search for the next piece of content by asking 
            //which handler can find conent.
            handler = null;
            for (var i = 0; i < handlers.length; i++) {
                if (handlers[i].hasContent()) {

                    handler = handlers[i];
                    break;
                }
            }
            return handler !== null;
        };
        var doFunc = function(callback) {

            //extract the source string and string in content to be replaced
            var details = handler.getContentDetails();
            pb.log.debug("WPXMLParseService: Discovered media type [%s] with source [%s] and replacement [%s]", handler.name, details.source, details.replacement);

            //retrieve media object
            handler.getMediaObject(details, function(err, mediaObj) {
                if (util.isError(err)) {
                    pb.log.error('WPXMLParseService: Failed to create media object. Source: [%s] Replacement: [%s]. %s', details.source, details.replacement, err.stack); 
                }
                if (!mediaObj) {

                    //we couldn't get the media for whatever reason but we'll leave 
                    //you a nice note to manually fix it.
                    content = content.replace(details.replacement, util.format("[Content: %s Goes Here]", details.source));
                    return callback();
                }

                //persist the media descriptor
                var mediaService = new pb.MediaService(null, self.site, true);
                mediaService.save(mediaObj, function(err, results) {
                    if (util.isError(err)) {
                        return callback(err);
                    }

                    //do the final replacement with the correctly formatted template engine flag
                    mediaObjects.push(mediaObj);
                    content = content.replace(details.replacement, util.format('^media_display_%s/position:center^', mediaObj[pb.DAO.getIdField()]));
                    callback();
                });
            });
        };
        async.whilst(whileFunc, doFunc, function(err){
            cb(err, content, mediaObjects);
        });
    };

    WPXMLParseService.prototype.createMediaObject = function(mediaType, location, cb) {

        var options = {
            where: {
                location: location
            },
            limit: 1
        };
        var mediaService = new pb.MediaService(null, this.site, true);
        mediaService.get(options, function(err, mediaArray) {
            if (util.isError(err)) {
                return cb(err);   
            }
            else if(mediaArray.length > 0) {
                return cb(null, mediaArray[0]);
            }

            var isFile = location.indexOf('/media') === 0;
            var mediadoc = {
                is_file: isFile,
                media_type: mediaType,
                location: location,
                thumb: location,
                name: 'Media_' + util.uniqueId(),
                caption: '',
                media_topics: []
            };

            //persist the 
            var newMedia = pb.DocumentCreator.create('media', mediadoc);
            cb(null, newMedia);
        });
    };

    WPXMLParseService.prototype.downloadMediaContent = function(srcString, cb) {
        var self = this;
        if (util.isNullOrUndefined(srcString) || srcString.indexOf('http') !== 0) {
            return cb(new Error('Invalid protocol on URI: '+srcString));
        }
        
        //only load the modules into memory if we really have to.  Footprint isn't 
        //much but it all adds up
        var ht = srcString.indexOf('https://') >= 0 ? require('https') : require('http');

        //create a functiont to download the content
        var run = function() {
            ht.get(srcString, function(res) {
                self.saveMediaContent(srcString, res, cb);
            });
        };

        //wrapper the whole thing in a domain to protect it from timeouts and other 
        //crazy network errors.
        var d = domain.create();
        d.once('error', function(err) {
            cb(err);
        });
        d.on('error', function(err) {/* generic handler so we catch any continuous errors */});
        d.run(function() {
            process.nextTick(run);
        });
    };

    WPXMLParseService.prototype.saveMediaContent = function(originalFilename, stream, cb) {
        var mediaService = new pb.MediaService(null, this.site, true);
        mediaService.setContentStream(stream, originalFilename, function(err, result) {
            cb(err, result ? result.mediaPath : null);
        });
    };
    
    WPXMLParseService.prototype.uniqueStrVal = function(prefix) {
        return prefix + '-' + (DEFAULT_COUNTER++) + '-' + (new Date()).getTime();
    };

    //exports
    return WPXMLParseService;
};
