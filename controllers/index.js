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

	TopMenu.getTopMenu(self.session, self.localizationService, function(themeSettings, navigation, accountButtons) {
        TopMenu.getBootstrapNav(navigation, accountButtons, function(navigation, accountButtons) {

        	self.ts.registerLocal('navigation', navigation);
        	self.ts.registerLocal('account_buttons', accountButtons);
        	self.ts.load('index', function(err, result) {

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

Index.prototype.processArticles = function(result, articles, themeSettings, cb) {
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
                        cb({content: content});
                    });
                });
            });
        });
    });
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

            var result = '';console.log('as='+util.inspect(articles));
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
                var commentHTML = commentTemplate.split('^commenter_photo^').join(comments[i].commenter_photo)
                .split('^display_photo^').join('block');
            }
            else {
                var commentHTML = commentTemplate.split('^display_photo^').join('none')
                .split('^commenter_photo^').join('')
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

Index.prototype.getPageName = function() {
	return pb.config.siteName;
};

//exports
module.exports = Index;
