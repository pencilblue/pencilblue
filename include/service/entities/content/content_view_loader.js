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
var util        = require('../../../util.js');
var async       = require('async');
var HtmlEncoder = require('htmlencode');

module.exports = function(pb) {
    
    //pb dependencies
    var DAO          = pb.DAO;
    var Localization = pb.Localization;
    var ClientJs     = pb.ClientJs;
    
    function ContentViewRenderer(context) {
        
        this.ts = context.ts;
        this.ls = context.ls;
        this.req = context.req;
        this.contentSettings = context.contentSettings; 
        this.session = context.session;
        this.service = context.service;
    };
    
    /**
     *
     * @private
     * @static
     * @property DISPLAY_NONE_STYLE_ATTR
     * @type {String}
     */
    var DISPLAY_NONE_STYLE_ATTR = 'display:none;';
    
    ContentViewRenderer.prototype.renderSingle = function(content, options, cb) {
        this.render([content], options, cb);
    };
    
    ContentViewRenderer.prototype.render = function(contentArray, options, cb) {
        var self = this;
        
        
        self.setMetaInfo(data.meta, options);
        self.ts.registerLocal('current_url', self.req.url);
        self.ts.registerLocal('navigation', new pb.TemplateValue(data.nav.navigation, false));
        self.ts.registerLocal('account_buttons', new pb.TemplateValue(data.nav.accountButtons, false));
        self.ts.registerLocal('infinite_scroll', function(flag, cb) {
            self.onInfiniteScroll(contentArray, options, cb);
        });
        self.ts.registerLocal('page_name', function(flag, cb) {
            self.onPageName(contentArray, options, cb);
        });
        self.ts.registerLocal('angular', function(flag, cb) {
            self.onAngular(contentArray, options, cb);
        });
        self.ts.registerLocal('articles', function(flag, cb) {
            sef.onContent(contentArray, options, cb);
        });
    };
    
    ContentViewRenderer.prototype.onContent = function(contentArray, options, cb) {
        
        var createHandler = function(content, options) {
            return function(callback) {
                
                //TODO render article here
                cb(null, new pb.TemplateValue('', false));
            };
        };
        var content = '';
        var limit = Math.min(this.contentSettings.articles_per_page, contentArray.length);
        for (var i = 0; i < limit; i++) {
            
            var key  = 'content_' + i;
            var flag = '^' + key '^';
            content += key;
            this.ts.registerLocal(key, createHandler(contentArray[i], options));
        };
        
        cb(null, content);
    };
    
    ContentViewRenderer.prototype.gatherData = function(contentArray, options, cb) {
        var self  = this;
        var tasks = {

            //navigation
            nav: function(callback) {
                self.getNavigation(function(themeSettings, navigation, accountButtons) {
                    callback(
                        null, 
                        {
                            themeSettings: themeSettings, 
                            navigation: navigation, 
                            accountButtons: accountButtons
                        }
                    );
                });
            },

            meta: function(callback) {
                self.getMetaInfo(contentArray, options, callback);
            }
        };
        async.parallel(tasks, cb);
    };
    
    ContentViewRenderer.prototype.onAngular = function(contentArray, options, cb) {
        var objects = {
            trustHTML: 'function(string){return $sce.trustAsHtml(string);}'
        };
        var angularData = pb.ClientJs.getAngularController(objects, ['ngSanitize']);
        cb(null, angularData);
    };
    
    ContentViewRenderer.prototype.onPageName = function(contentArray, options, cb) {
        var content = contentArray[0];
        if (!util.isObject(content)) {
            return cb(null, options.metaTitle || pb.config.siteName);
        }

        var name = '';
        if(util.isObject(options.section)) {
            name = options.section.name;
        }
        else if (util.isObject(options.topic)) {
            name = options.topic.name;
        }
        else if (contentArray.length === 1) {
            name = content.headline;
        }
        else {
            name = options.metaTitle || '';
        }
        
        cb(null, name ? name + ' | ' + pb.config.siteName : pb.config.siteName);
    };
    
    ContentViewRenderer.prototype.onInfiniteScroll = function(contentArray, options, cb) {
        if(contentArray.length > 1) {
            return cb(null, '');
        }

        var infiniteScrollScript = pb.ClientJs.includeJS('/js/infinite_article_scroll.js');
        if(util.isObject(options.section)) {
            infiniteScrollScript += pb.ClientJs.getJSTag('var infiniteScrollSection = "' + options.section[pb.DAO.getIdField()] + '";');
        }
        else if(util.isObject(options.topic)) {
            infiniteScrollScript += pb.ClientJs.getJSTag('var infiniteScrollTopic = "' + options.topic.topic[pb.DAO.getIdField()] + '";');
        }

        var val = new pb.TemplateValue(infiniteScrollScript, false);
        cb(null, val);
    };
    
    ContentViewRenderer.prototype.setMetaInfo = function(meta, options) {
        this.ts.registerLocal('meta_keywords', meta.keywords);
        this.ts.registerLocal('meta_desc', options.metaDescription || meta.description);
        this.ts.registerLocal('meta_title', options.metaTitle || meta.title);
        this.ts.registerLocal('meta_thumbnail', meta.thumbnail);
        this.ts.registerLocal('meta_lang', Localization.getDefaultLocale());
    };
    
    ContentViewRenderer.prototype.getMetaInfo = function(contentArray, options, cb) {
        
        var articleService = context.service;
        articleService.getMetaInfo(contentArray[0], cb);
    };
    
    ContentViewRenderer.prototype.renderContent = function(content, options, cb) {
        var self = this;
        
        //set recurring params
        if (util.isNullOrUndefined(options.contentIndex)) {
            options.contentIndex = 0;
        }

        var isPage           = this.service.getType() === 'page';
        var showByLine       = this.contentSettings.display_bylines && !isPage;
        var showTimestamp    = this.contentSettings.display_timestamp && !isPage;
        var ats              = new pb.TemplateService(this.ls);
        var contentUrlPrefix = '/' + this.service.getType() + '/';

        ats.registerLocal('article_permalink', function(flag, cb) {
            self.onContentPermalink(content, options, cb);
        });
        ats.registerLocal('article_headline', function(flag, cb) {
            self.onContentHeadline(content, options, cb);
        });
        ats.registerLocal('article_headline_nolink', content.headline);
        ats.registerLocal('article_subheading', ContentViewRenderer.valOrEmpty(content.subheading));
        ats.registerLocal('article_subheading_display', ContentViewRenderer.getDisplayAttr(content.subheading));
        ats.registerLocal('article_id', content[pb.DAO.getIdField()] + '');
        ats.registerLocal('article_index', options.contentIndex++);
        ats.registerLocal('article_timestamp', showTimestamp && content.timestamp ? content.timestamp : '');
        ats.registerLocal('article_timestamp_display', ContentViewRenderer.getDisplayAttr(showTimestamp));
        ats.registerLocal('article_layout', new pb.TemplateValue(content.layout, false));
        ats.registerLocal('article_url', content.url);
        ats.registerLocal('display_byline', ContentViewRenderer.getDisplayAttr(showByLine));
        ats.registerLocal('author_photo', ContentViewRenderer.valOrEmpty(content.author_photo));
        ats.registerLocal('author_photo_display', ContentViewRenderer.getDisplayAttr(content.author_photo));
        ats.registerLocal('author_name', ContentViewRenderer.valOrEmpty(content.author_name));
        ats.registerLocal('author_position', ContentViewRenderer.valOrEmpty(content.author_position));
        ats.registerLocal('media_body_style', ContentViewRenderer.valOrEmpty(content.media_body_style));
        ats.registerLocal('comments', function(flag, cb) {
            if (isPage || !pb.ArticleService.allowComments(contentSettings, content)) {
                return cb(null, '');
            }

            self.renderComments(content, ats, function(err, comments) {
                cb(err, new pb.TemplateValue(comments, false));
            });
        });
        ats.load('elements/article', cb);
    };
    
    ContentViewRenderer.prototype.renderComments = function(content, cb) {
        var self           = this;
        var ts             = new pb.TemplateService();
        var commentingUser = null;
        if(pb.security.isAuthenticated(this.session)) {
            commentingUser = Comments.getCommentingUser(this.session.authentication.user);
        }

        ts.registerLocal('user_photo', function(flag, cb) {
            self.onCommentingUserPhoto(content, commentingUser, cb);
        });
        ts.registerLocal('user_position', function(flag, cb) {
            self.onCommentingUserPosition(content, commentingUser, cb);
        });
        ts.registerLocal('user_name', commentingUser ? commentingUser.name : '');
        ts.registerLocal('display_submit', commentingUser ? 'block' : 'none');
        ts.registerLocal('display_login', commentingUser ? 'none' : 'block');
        ts.registerLocal('comments_length', util.isArray(content.comments) ? content.comments.length : 0);
        ts.registerLocal('individual_comments', function(flag, cb) {
            if (!util.isArray(content.comments) || content.comments.length == 0) {
                return cb(null, '');
            }

            var tasks = util.getTasks(content.comments, function(comments, i) {
                return function(callback) {
                    self.renderComment(comments[i], callback);
                };
            });
            async.parallel(tasks, function(err, results) {
                cb(err, new pb.TemplateValue(results.join(''), false));
            });
        });
        ts.load('elements/comments', cb);
    };
    
    ContentViewRenderer.prototype.renderComment = function(comment, cb) {

        var cts = new pb.TemplateService(this.ls);
        cts.reprocess = false;
        cts.registerLocal('commenter_photo', comment.commenter_photo ? comment.commenter_photo : '');
        cts.registerLocal('display_photo', comment.commenter_photo ? 'block' : 'none');
        cts.registerLocal('commenter_name', comment.commenter_name);
        cts.registerLocal('commenter_position', comment.commenter_position ? ', ' + comment.commenter_position : '');
        cts.registerLocal('content', comment.content);
        cts.registerLocal('timestamp', comment.timestamp);
        cts.load('elements/comments/comment', cb);
    };
    
    ContentViewRenderer.prototype.onCommentingUserPosition = function(content, commentingUser, cb) {
        var val = '';
        if (commentingUser) {
            val = commentingUser.photo || '';
        }
        cb(null, val);
    };
    
    ContentViewRenderer.prototype.onCommentingUserPosition = function(content, commentingUser, cb) {
        var val = '';
        if (commentingUser && util.isArray(commentingUser.position) && commentingUser.position.length > 0) {
            val = ', ' + commentingUser.position;
        }
        cb(null, val);
    };
    
    ContentViewRenderer.prototype.onContentPermalink = function(content, options, cb) {
        cb(null, this.createContentPermalink(content));
    };
    
    ContentViewRenderer.prototype.onContentHeadline = function(content, options, cb) {
        var url = this.createContentPermalink(content);
        var val = new pb.TemplateValue('<a href="' + url + '">' + HtmlEncoder.htmlEncode(content.headline) + '</a>', false)
    };
    
    ContentViewRenderer.prototype.createContentPermalink = function(content) {
        var prefix = '/' + this.service.getType();
        return pb.UrlService.createSystemUrl(pb.UrlService.urlJoin(prefix, content.url));
    };
    
    ContentViewRenderer.getDisplayAttr = function(val) {
        return val ? '' : DISPLAY_NONE_STYLE_ATTR;
    };
    
    ContentViewRenderer.valOrEmpty = function(val) {
        return val ? val : '';
    };
};