/**
 * Index page of the pencilblue theme
 *
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function Index(){}

//dependencies
var TopMenu        = require('../include/theme/top_menu');
var Media          = require('../include/theme/media');
var Comments       = require('../include/theme/comments');
var ArticleService = require('../include/service/entities/article_service').ArticleService;

//inheritance
util.inherits(Index, pb.BaseController);

Index.prototype.render = function(cb) {
	var self = this;
    
    //determine and execute the proper call
    var section = self.req.pencilblue_section || null;
    var topic   = self.req.pencilblue_topic   || null;
    var article = self.req.pencilblue_article || null;
    var page    = self.req.pencilblue_page    || null;

    pb.content.getSettings(function(err, contentSettings) {
        self.gatherData(function(err, data) {

            ArticleService.getMetaInfo(data.content[0], function(metaKeywords, metaDescription, metaTitle) {

                self.ts.registerLocal('meta_keywords', metaKeywords);
                self.ts.registerLocal('meta_desc', metaDescription);
                self.ts.registerLocal('meta_title', metaTitle);
                self.ts.registerLocal('meta_lang', localizationLanguage);
                self.ts.registerLocal('current_url', self.req.url);
                self.ts.registerLocal('page_name', '^index_page_name^');
                self.ts.registerLocal('navigation', data.nav.navigation);
                self.ts.registerLocal('account_buttons', data.nav.accountButtons);
                self.ts.registerLocal('infinite_scroll', function(flag, cb) {
                    if(article || page) {
                        cb(null, '');
                    }
                    else {
                        var infiniteScrollScript = pb.js.includeJS('/js/infinite_article_scroll.js');
                        if(section) {
                            infiniteScrollScript += pb.js.getJSTag('var infiniteScrollSection = "' + section + '";');
                        }
                        else if(topic) {
                            infiniteScrollScript += pb.js.getJSTag('var infiniteScrollTopic = "' + topic + '";');
                        }
                        cb(null, infiniteScrollScript);
                    }
                });
                self.ts.registerLocal('articles', function(flag, cb) {
                    var tasks = pb.utils.getTasks(data.content, function(content, i) {
                        return function(callback) {
                            self.renderContent(content[i], contentSettings, data.nav.themeSettings, i, callback);
                        };
                    });
                    async.parallel(tasks, function(err, result) {
                        cb(err, result.join(''));
                    });
                });
                self.ts.load('index', function(err, result) {
                    if (util.isError(err)) {
                        throw err;
                    }
                    cb({content: result});
                    //self.processArticles(result, data.content, data.nav.themeSettings, cb);
                });
            });
        });
    });
};

Index.prototype.gatherData = function(cb) {
    var self  = this;
    var tasks = {
        
        //navigation
        nav: function(callback) {
            self.getNavigation(function(themeSettings, navigation, accountButtons) {
                callback(null, {themeSettings: themeSettings, navigation: navigation, accountButtons: accountButtons}); 
            });
        },
        
        //articles, pages, etc.
        content: function(callback) {
            self.loadContent(callback);
        }
    };
    async.parallel(tasks, cb);
};

Index.prototype.loadContent = function(articleCallback) {
    
    var section = this.req.pencilblue_section || null;
    var topic   = this.req.pencilblue_topic   || null;
    var article = this.req.pencilblue_article || null;
    var page    = this.req.pencilblue_page    || null;
    
    var service = new ArticleService();
    if(this.req.pencilblue_preview) {
        if(this.req.pencilblue_preview == page || article) {
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
}

Index.prototype.processArticles = function(result, articles, themeSettings, cb) {
	var self = this;

    pb.content.getSettings(function(err, contentSettings) {

        articles = articles.slice(0, contentSettings.articles_per_page);

        ArticleService.getMetaInfo(articles[0], function(metaKeywords, metaDescription, metaTitle) {

            result = result.split('^meta_keywords^').join(metaKeywords);
            result = result.split('^meta_desc^').join(metaDescription);
            result = result.split('^meta_title^').join(metaTitle);
            result = result.split('^meta_lang^').join(self.ls.language);
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

                    var objects = {
                        contentSettings: contentSettings,
                        loggedIn: loggedIn,
                        commentingUser: commentingUser,
                        themeSettings: themeSettings,
                        articles: articles,
                        trustHTML: 'function(string){return $sce.trustAsHtml(string);}'
                    };
                    var angularData = pb.js.getAngularController(objects, ['ngSanitize']);
                    result = result.concat(angularData);

                    var content = self.localizationService.localize(['pencilblue_generic', 'timestamp'], result);

                    self.getContentSpecificPageName(function(pageName) {
                        content = content.split('^index_page_name^').join(pageName);

                        cb({content: content});
                    });
                });
            });
        });
    });
};

Index.prototype.renderContent = function(content, contentSettings, themeSettings, index, cb) {
    var self = this;
    var ats  = new pb.TemplateService(this.ls);
    ats.registerLocal('article_headline', '<a href="' + pb.UrlService.urlJoin('/article/', content.url) + '">' + content.headline + '</a>');
    ats.registerLocal('article_subheading', content.subheading ? content.subheading : '');
    ats.registerLocal('article_subheading_display', content.subheading ? '' : 'display:none;');
    ats.registerLocal('article_id', content._id.toString());
    ats.registerLocal('article_index', index);
    ats.registerLocal('article_timestamp', contentSettings.display_timestamp ? content.timestamp : '');
    ats.registerLocal('article_timestamp_display', contentSettings.displaytimestamp ? '' : 'display:none;');
    ats.registerLocal('article_layout', content.layout);
    ats.registerLocal('article_url', content.url);
    ats.registerLocal('author_photo', content.author_photo ? content.author_photo : '');
    ats.registerLocal('author_photo_display', content.author_photo ? '' : 'display:none;');
    ats.registerLocal('author_name', content.author_name);
    ats.registerLocal('author_position', content.author_position);
    ats.registerLocal('media_body_style', content.media_body_style ? content.media_body_style : '');
    ats.registerLocal('comments', function(flag, cb) {
       if (content.object_type === 'page' || !contentSettings.allow_comments) {
           cb(null, '');
           return;
       }
        
        self.renderComments(content, ats, cb);
    });
    ats.load('elements/article', cb);
};

Index.prototype.renderComments = function(content, ts, cb) {
    var commentingUser = null;
    if(pb.security.isAuthenticated(this.session)) {
        commentingUser = Comments.getCommentingUser(this.session.authentication.user);
    }
    
    ts.registerLocal('user_photo', function(flag, cb) {
        if (commentingUser) {
            cb(null, commentingUser.photo ? commentingUser.photo : '');
        }
        else {
            cb(null, '');
        }
    });
    ts.registerLocal('user_position', function(flag, cb) {
        if (commentingUser && util.isArray(commentingUser.position) && commentingUser.position.length > 0) {
            cb(null, ', ' + commentingUser.position);
        }
        else {
            cb(null, '');
        }
    });
    ts.registerLocal('user_name', commentingUser ? commentingUser.name : '');
    ts.registerLocal('display_submit', commentingUser ? 'block' : 'none');
    ts.registerLocal('display_login', commentingUser ? 'none' : 'block');
    ts.registerLocal('comments_length', util.isArray(content.comments) ? content.comments.length : 0);
    ts.registerLocal('individual_comments', function(flag, cb) {
        cb(null, '');   
    });
    ts.load('elements/comments', cb);
};

Index.prototype.getArticlesHTML = function(articles, commentsTemplates, contentSettings, commentingUser, cb) {
    var self = this;
    var articleTemplate = '';
    var bylineTemplate = '';

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

                if(articles.length > 1) {
                    articleHTML = articleHTML.split('^article_headline^').join('<a href="' + pb.config.siteRoot + '/article/' + articles[i].url + '">' + articles[i].headline + '</a>');
                }
                else {
                    articleHTML = articleHTML.split('^article_headline^').join(articles[i].headline);
                }

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

Index.prototype.formatComments = function(articleHTML, comments, commentingUser, commentTemplate) {
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

Index.prototype.getContentSpecificPageName = function(cb) {
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

Index.prototype.getNavigation = function(cb) {
    TopMenu.getTopMenu(this.session, this.ls, function(themeSettings, navigation, accountButtons) {
        TopMenu.getBootstrapNav(navigation, accountButtons, function(navigation, accountButtons) {
            cb(themeSettings, navigation, accountButtons);
        });
    });
};

//exports
module.exports = Index;
