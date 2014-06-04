/**
 * Blog - The blogroll controller of the portfolio theme.
 *
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright 2014 PencilBlue, LLC.  All Rights Reserved
 */

function Blog() {}

//dependencies
var PluginService = pb.PluginService;
var TopMenu       = require(DOCUMENT_ROOT + '/include/theme/top_menu');
var Media          = require(DOCUMENT_ROOT + '/include/theme/media');
var Comments       = require(DOCUMENT_ROOT + '/include/theme/comments');
var ArticleService = require(DOCUMENT_ROOT + '/include/service/entities/article_service').ArticleService;

//inheritance
util.inherits(Blog, pb.BaseController);

/**
* This is the function that will be called by the system's RequestHandler.  It
* will map the incoming route to the ones below and then instantiate this
* prototype.  The request handler will then proceed to call this function.
* Its callback should contain everything needed in order to provide a response.
*
* @param cb The callback.  It does not require a an error parameter.  All
* errors should be handled by the controller and format the appropriate
*  response.  The system will attempt to catch any catastrophic errors but
*  makes no guarantees.
*/
Blog.prototype.render = function(cb) {
    var self = this;

    var content = {
        content_type: "text/html",
        code: 200
    };

    TopMenu.getTopMenu(self.session, self.localizationService, function(themeSettings, navigation, accountButtons) {
        TopMenu.getBootstrapNav(navigation, accountButtons, function(navigation, accountButtons) {

            self.ts.registerLocal('page_name', '^blog_page_name^');
            self.ts.registerLocal('navigation', navigation);
            self.ts.registerLocal('account_buttons', accountButtons);
            self.ts.load('blog', function(err, template) {
                if(util.isError(err)) {
                    result = '';
                }
                else {
                    result = template;
                }

                //create callback to be issued by all the find calls
                var articleCallback = function(err, articles) {
                    self.processArticles(result, articles, themeSettings, cb);
                };


                //determine and execute the proper call
                var section = self.req.pencilblue_section || null;
                var topic   = self.req.pencilblue_topic   || null;
                var article = self.req.pencilblue_article || null;
                var page    = self.req.pencilblue_page    || null;

                if(article || page) {
                    result = result.split('^infinite_scroll^').join('');
                }
                else {
                    var infiniteScrollScript = pb.js.includeJS('/js/infinite_article_scroll.js');
                    if(section) {
                        infiniteScrollScript += pb.js.getJSTag('var infiniteScrollSection = "' + section + '";');
                    }
                    else if(topic) {
                        infiniteScrollScript += pb.js.getJSTag('var infiniteScrollTopic = "' + topic + '";');
                    }

                    result = result.split('^infinite_scroll^').join(infiniteScrollScript);
                }

                var service = new ArticleService();
                if(self.req.pencilblue_preview) {
                    if(self.req.pencilblue_preview == page || article) {
                        if(page) {
                            service.setContentType('page');
                        }
                        var where = pb.DAO.getIDWhere(page || article);
                        where.draft = {$gte: 0};
                        service.find(where, articleCallback);
                    }
                    else {
                        service.find({}, articleCallback);
                    }
                }
                else if(section) {
                    service.findBySection(section, articleCallback);
                }
                else if(topic) {
                    service.findByTopic(topic, articleCallback);
                }
                else if(article) {
                    service.findById(article, articleCallback);
                }
                else if(page) {
                    service.setContentType('page');
                    service.findById(page, articleCallback);
                }
                else{
                    service.find({}, articleCallback);
                }
            });
        });
    });
};

Blog.prototype.processArticles = function(result, articles, themeSettings, cb) {
    var self = this;

    Media.getCarousel(themeSettings.carousel_media, result, '^carousel^', 'index_carousel', function(newResult) {

        pb.content.getSettings(function(err, contentSettings) {

            articles = articles.slice(0, contentSettings.articles_per_page);

            ArticleService.getMetaInfo(articles[0], function(metaKeywords, metaDescription, metaTitle) {

                result = result.split('^meta_keywords^').join(metaKeywords);
                result = result.split('^meta_desc^').join(metaDescription);
                result = result.split('^meta_title^').join(metaTitle);
                result = result.split('^meta_lang^').join(localizationLanguage);
                result = result.split('^current_url^').join(self.req.url);

                Comments.getCommentsTemplates(contentSettings, function(commentsTemplates) {

                    var loggedIn       = false;
                    var commentingUser = null;
                    if(self.session.authentication.user) {
                        loggedIn       = true;
                        commentingUser = Comments.getCommentingUser(self.session.authentication.user);
                    }

                    self.getArticlesHTML(articles, commentsTemplates, contentSettings, commentingUser, function(articlesHTML) {
                        result = result.split('^articles^').join(articlesHTML);



                        self.getContentSpecificPageName(function(pageName) {
                            result = result.split('^blog_page_name^').join(pageName);

                            self.getSideNavigation(articles, function(sideNavTemplate, sideNavTitle, sideNavItems) {
                                self.ts.registerLocal('side_nav_title', sideNavTitle);
                                self.ts.load(sideNavTemplate, function(err, template) {
                                    if(util.isError(err)) {
                                        template = '';
                                    }

                                    result = result.split('^side_nav^').join(template);

                                    var objects = {
                                        contentSettings: contentSettings,
                                        loggedIn: loggedIn,
                                        commentingUser: commentingUser,
                                        themeSettings: themeSettings,
                                        articles: articles,
                                        sideNavItems: sideNavItems,
                                        trustHTML: 'function(string){return $sce.trustAsHtml(string);}'
                                    };
                                    var angularData = pb.js.getAngularController(objects, ['ngSanitize']);
                                    result = result.concat(angularData);

                                    cb({content: self.localizationService.localize(['pencilblue_generic', 'timestamp'], result)});
                                });
                            });
                        });
                    });
                });
            });
        });
    });
};

Blog.prototype.getArticlesHTML = function(articles, commentsTemplates, contentSettings, commentingUser, cb) {
    var self = this;
    var articleTemplate = '';
    var bylineTemplate = '';

    if(articles.length === 0) {
        self.ts.load('elements/article/no_articles', function(err, result) {
            cb(result);
        });
        return;
    }

    self.ts.load('elements/article', function(err, data) {
        articleTemplate = data;
        self.ts.load('elements/article/byline', function(err, data) {
            bylineTemplate = data;

            if(!self.req.pencilblue_page) {
                if(contentSettings.display_bylines) {
                    articleTemplate = articleTemplate.split('^byline^').join(bylineTemplate);
                }
                else {
                    articleTemplate = articleTemplate.split('^byline^').join('');
                }
            }
            else {
                articleTemplate = articleTemplate.split('^byline^').join('');
            }

            if(!self.req.pencilblue_page && contentSettings.allow_comments) {
                articleTemplate = articleTemplate.split('^comments^').join(commentsTemplates.commentsContainer);
            }
            else {
                articleTemplate = articleTemplate.split('^comments^').join('');
            }

            var result = '';
            for(var i = 0; i < articles.length; i++)
            {
                var articleHTML = articleTemplate.split('^article_id^').join(articles[i]._id.toString());
                articleHTML = articleHTML.split('^article_index^').join(i.toString());
                articleHTML = articleHTML.split('^article_url^').join(articles[i].url);
                articleHTML = articleHTML.split('^author_photo^').join(articles[i].author_photo);
                articleHTML = articleHTML.split('^author_name^').join(articles[i].author_name);
                articleHTML = articleHTML.split('^author_position^').join(articles[i].author_position);

                articleHTML = articleHTML.split('^article_headline^').join('<a href="' + pb.config.siteRoot + '/article/' + articles[i].url + '">' + articles[i].headline + '</a>');

                if(articles[i].subheading) {
                    articleHTML = articleHTML.split('^article_subheading^').join(articles[i].subheading);
                    articleHTML = articleHTML.split('^article_subheading_display^').join('');
                }
                else {
                    articleHTML = articleHTML.split('^article_subheading_display^').join('display: none');
                }

                if(contentSettings.display_timestamp) {
                    articleHTML = articleHTML.split('^article_timestamp^').join(articles[i].timestamp);
                    articleHTML = articleHTML.split('^article_timestamp_display^').join('');
                }
                else {
                    articleHTML = articleHTML.split('^article_timestamp_display^').join('display: none');
                }

                articleHTML = articleHTML.split('^article_layout^').join(articles[i].layout);

                if(contentSettings.allow_comments) {
                    articleHTML = self.formatComments(articleHTML, articles[i].comments, commentingUser, commentsTemplates.comment);
                }

                result = result.concat(articleHTML);
            }

            cb(result);
        });
    });
};

Blog.prototype.formatComments = function(articleHTML, comments, commentingUser, commentTemplate) {
    if(commentingUser) {
        articleHTML = articleHTML.split('^display_submit^').join('block')
        .split('^display_login^').join('none');
    }
    else {
        articleHTML = articleHTML.split('^display_submit^').join('none')
        .split('^display_login^').join('block');
    }

    if(comments) {
        var commentsHTML = '';
        for(var i = 0; i < comments.length; i++) {
            if(comments[i].commenter_photo) {
                commentHTML = commentTemplate.split('^commenter_photo^').join(comments[i].commenter_photo)
                .split('^display_photo^').join('block');
            }
            else {
                commentHTML = commentTemplate.split('^display_photo^').join('none')
                .split('^commenter_photo^').join('');
            }
            commentHTML = commentHTML.split('^commenter_name^').join(comments[i].commenter_name);
            if(comments[i].commenter_position) {
                commentHTML = commentHTML.split('^commenter_position^').join(', ' + comments[i].commenter_position);
            }
            else {
                commentHTML = commentHTML.split('^commenter_position^').join('');
            }

            commentHTML = commentHTML.split('^content^').join(comments[i].content)
            .split('^timestamp^').join(comments[i].timestamp);

            commentsHTML = commentsHTML.concat(commentHTML);
        }

        articleHTML = articleHTML.split('^comments_length^').join(comments.length)
        .split('^comments^').join(commentsHTML);
    }
    else
    {
        articleHTML = articleHTML.split('^comments_length^').join('0')
        .split('^comments^').join('');
    }

    if(commentingUser) {
        articleHTML = articleHTML.split('^user_photo^').join((commentingUser.photo) ? commentingUser.photo : '')
        .split('^user_name^').join(commentingUser.name);
        if(commentingUser.position && commentingUser.position.length) {
            articleHTML = articleHTML.split('^user_position^').join(', ' + commentingUser.position);
        }
        else {
            articleHTML = articleHTML.split('^user_position^').join('');
        }
    }
    else {
        articleHTML = articleHTML.split('^user_photo^').join('');
    }

    return articleHTML;
};

Blog.prototype.getContentSpecificPageName = function(cb) {
    var dao = new pb.DAO();

    if(this.req.pencilblue_article) {
        dao.loadById(this.req.pencilblue_article, 'article', function(err, article) {
            if(util.isError(err) || article === null) {
                cb(pb.config.siteName);
                return;
            }

            cb(article.headline + ' | ' + pb.config.siteName);
        });
    }
    else if(this.req.pencilblue_page) {
        dao.loadById(this.req.pencilblue_page, 'page', function(err, page) {
            if(util.isError(err) || page === null) {
                cb(pb.config.siteName);
                return;
            }

            cb(page.headline + ' | ' + pb.config.siteName);
        });
    }
    else if(this.req.pencilblue_section) {
        dao.loadById(this.req.pencilblue_section, 'section', function(err, section) {
            if(util.isError(err) || section === null) {
                cb(pb.config.siteName);
                return;
            }

            cb(section.name + ' | ' + pb.config.siteName);
        });
    }
    else if(this.req.pencilblue_topic) {
        dao.loadById(this.req.pencilblue_topic, 'section', function(err, topic) {
            if(util.isError(err) || topic === null) {
                cb(pb.config.siteName);
                return;
            }

            cb(topic.name + ' | ' + pb.config.siteName);
        });
    }
    else {
        cb(pb.config.siteName);
    }
};

Blog.prototype.getSideNavigation = function(articles, cb) {
    var topics = [];
    var articleIDs = [];

    if(this.req.pencilblue_article) {
        topics = articles[0].article_topics;
        articleIDs = [articles[0]._id];
    }
    else if(this.req.pencilblue_page) {
        articleIDs = [];
        for(i = 0; i < articles.length; i++) {
            for(j = 0; j < articles[i].page_topics.length; j++) {
                topics.push(articles[i].page_topics[j]);
            }
        }
    }
    else {
        for(var i = 0; i < articles.length; i++) {
            articleIDs.push(articles[i]._id);
            for(var j = 0; j < articles[i].article_topics.length; j++) {
                topics.push(articles[i].article_topics[j]);
            }
        }
    }

    var dao = new pb.DAO();
    dao.query('article', {article_topics: {$in: topics}, _id: {$nin: articleIDs}}, null, null, 6).then(function(relatedArticles) {
        if(relatedArticles.length === 0) {
            dao.query('article', {_id: {$ne: articles[0]._id}}, null, null, 6).then(function(relatedArticles) {
                cb('elements/side_nav/related_articles', '^loc_RELATED_ARTICLES^', relatedArticles);
            });
            return;
        }
        cb('elements/side_nav/related_articles', '^loc_RELATED_ARTICLES^', relatedArticles);
    });
};

/**
* Provides the routes that are to be handled by an instance of this prototype.
* The route provides a definition of path, permissions, authentication, and
* expected content type.
* Method is optional
* Path is required
* Permissions are optional
* Access levels are optional
* Content type is optional
*
* @param cb A callback of the form: cb(error, array of objects)
*/
Blog.getRoutes = function(cb) {
    var routes = [
        {
            method: 'get',
            path: '/blog',
            auth_required: false,
            content_type: 'text/html'
        }
    ];
    cb(null, routes);
};

//exports
module.exports = Blog;
