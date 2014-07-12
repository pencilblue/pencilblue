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
                            self.session.success = 'Good so far';
                            cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, 'Good so far')});
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

            if(!topicMatch && categories[i]['wp:cat_name'][j] !== 'uncategorized') {
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

    self.checkForExistingUser(0);
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
        dao.loadByValue('url', rawPage['wp:post_name'], 'page', function(err, existingPage) {
            if(existingPage) {
                pages.push(existingPage);
                index++;
                self.checkForExistingPage(index);
                return;
            }

            var pageTopics = [];
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
                var pageMedia = [];
                for(var i = 0; i < mediaObjects.length; i++) {
                    pageMedia.push(mediaObjects[i]._id.toString());
                }
                self.addMedia(mediaObjects);

                var newPage = pb.DocumentCreator.create('page', {url: rawPage['wp:post_name'], headline: rawPage.title[0], publish_date: new Date(rawPage['wp:post_date']), page_layout: updatedContent, page_topics: pageTopics, page_media: pageMedia});
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
        dao.loadByValue('url', rawArticle['wp:post_name'], 'article', function(err, existingArticle) {
            if(existingArticle) {
                articles.push(existingArticl);
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

            self.retrieveMediaObjects(rawArticle['content:encoded'][0], function(updatedContent, mediaObjects) {
                var articleMedia = [];
                for(var i = 0; i < mediaObjects.length; i++) {
                    articleMedia.push(mediaObjects[i]._id.toString());
                }
                self.addMedia(mediaObjects);

                var newArticle = pb.DocumentCreator.create('article', {url: rawArticle['wp:post_name'], headline: rawArticle.title[0], publish_date: new Date(rawArticle['wp:post_date']), article_layout: updatedContent, article_topics: articleTopics, article_media: articleMedia});
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
                if(media[j]._id.equals(mediaObjects[i])) {
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

ImportWP.prototype.retrieveMediaObject = function(content, cb) {
    cb(content, []);
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
