/**
 * Get articles within indices, for real time pagination
 *
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function GetArticles(){}

//dependencies
var Media          = require('../../../include/theme/media');
var Comments = require('../../../include/theme/comments');
var ArticleService = require('../../../include/service/entities/article_service').ArticleService;

//inheritance
util.inherits(GetArticles, pb.FormController);

GetArticles.prototype.render = function(cb) {
	var self = this;
	var get = this.query;

	pb.content.getSettings(function(err, contentSettings) {

	    if(!get.limit || get.limit.length === 0)
	    {
	        get.limit = contentSettings.articles_per_page;
	    }
	    if(!get.offset)
	    {
	        get.offset = contentSettings.articles_per_page;
	    }

	    self.limit = parseInt(get.limit);
	    self.offset = parseInt(get.offset);

	    //create callback to be issued by all the find calls
        var articleCallback = function(err, articles) {
        	self.processArticles(articles, cb);
        };

        var service = new ArticleService();

        if(get.section) {
            service.findBySection(get.section, articleCallback);
        }
        else if(get.topic) {
            service.findByTopic(get.topic, articleCallback);
        }
        else {
            service.find({}, articleCallback);
        }
    });
};

GetArticles.prototype.processArticles = function(articles, cb) {
	var self = this;
	var result = '';

	pb.content.getSettings(function(err, contentSettings) {

    	articles = articles.slice(self.offset, self.offset + self.limit);

        Comments.getCommentsTemplates(contentSettings, function(commentsTemplates) {

            var loggedIn       = false;
            var commentingUser = {};
            if(self.session.authentication.user) {
                loggedIn       = true;
                commentingUser = Comments.getCommentingUser(self.session.authentication.user);
            }

            self.getArticlesHTML(articles, commentsTemplates, contentSettings, commentingUser, function(articlesHTML) {
                var content = self.localizationService.localize(['pencilblue_generic', 'timestamp'], articlesHTML);
                cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, 'success', {count: articles.length, articles: content})});
            });
        });
    });
};

GetArticles.prototype.getArticlesHTML = function(articles, commentsTemplates, contentSettings, commentingUser, cb) {
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

            if(contentSettings.allow_comments) {
                articleTemplate = articleTemplate.split('^comments^').join(commentsTemplates.commentsContainer);
            }
            else {
                articleTemplate = articleTemplate.split('^comments^').join('');
            }

            var result = '';
            for(var i = 0; i < articles.length; i++)
            {
                var articleHTML = articleTemplate.split('^article_id^').join(articles[i]._id.toString());
                articleHTML = articleHTML.split('^article_index^').join((self.offset + i).toString());
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

GetArticles.prototype.formatComments = function(articleHTML, comments, commentingUser, commentTemplate) {

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
}

//exports
module.exports = GetArticles;
