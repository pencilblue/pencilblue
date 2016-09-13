/*
	Copyright (C) 2016  PencilBlue, LLC

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

    /**
     * Renders a 1 or more pieces of content such as articles or pages
     * @class ContentViewLoader
     * @constructor
     * @param {Object} context
     * @param {TemplateService} context.ts
     * @param {Localization} context.ls
     * @param {Object} [context.contentSettings]
     * @param {Object} context.session
     * @param {ContentObjectService} context.service
     * @param {String} context.activeTheme
     * @param {CommentService} [context.commentService]
     * @param {object} context.siteObj
     */
    function ContentViewLoader(context) {
        this.ts = context.ts;
        this.ls = context.ls;
        this.req = context.req;
        this.contentSettings = context.contentSettings;
        this.session = context.session;
        this.service = context.service;
        this.site = context.site;
        this.siteObj = context.siteObj;
        this.hostname = context.hostname;
        this.onlyThisSite = context.onlyThisSite;
        this.activeTheme = context.activeTheme;

        /**
         * @property commentService
         * @type {CommentService}
         */
        this.commentService = context.commentService || new pb.CommentService(context);
    }

    /**
     *
     * @private
     * @static
     * @property DISPLAY_NONE_STYLE_ATTR
     * @type {String}
     */
    var DISPLAY_NONE_STYLE_ATTR = 'display:none;';

    /**
     *
     * @method renderSingle
     * @param {Object} content
     * @param {Object} options
     * @param {Function} cb
     */
    ContentViewLoader.prototype.renderSingle = function(content, options, cb) {
        this.render([content], options, cb);
    };

    /**
     *
     * @method render
     * @param {Array} contentArray
     * @param {Object} options
     * @param {Boolean} [options.useDefaultTemplate] Forces the default theme template to be selected
     * @param {Object} [options.topic] The topic represented by the collection of content to be rendered
     * @param {Object} [options.section] The section represented by the collection of content to be rendered
     * @param {Function} cb
     */
    ContentViewLoader.prototype.render = function(contentArray, options, cb) {
        var self = this;

        this.gatherData(contentArray, options, function(err, data) {
            if (util.isError(err)) {
                return cb(err);
            }

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
                self.onContent(contentArray, options, cb);
            });

            self.getTemplate(contentArray, options, function(err, template) {
                if (util.isError(err)) {
                    return cb(err);
                }

                self.ts.load(template, cb);
            });
        });
    };

    /**
     *
     * @method getTemplate
     * @param {Array|Object} content
     * @param {Object} options
     * @param {Boolean} [options.useDefaultTemplate] Forces the default theme template to be selected
     * @param {Object} [options.topic] The topic represented by the collection of content to be rendered
     * @param {Object} [options.section] The section represented by the collection of content to be rendered
     * @param {Function} cb
     */
    ContentViewLoader.prototype.getTemplate = function(content, options, cb) {

        //check if we should just use whatever default there is.
        //this could fall back to an active theme or the default pencilblue theme.
        if (options.useDefaultTemplate || util.isObject(options.topic) || util.isObject(options.section)) {
            return cb(null, this.getDefaultTemplatePath());
        }

        //now we are dealing with a single page or article. the template will be
        //judged based off the article's preference.
        if (util.isArray(content) && content.length > 0) {
            content = content[0];
        }
        var uidAndTemplate = content.template;

        //when no template is specified or is empty we no that the article has no
        //preference and we can fall back on the default (index).  We depend on the
        //template service to determine who has priority based on the active theme
        //then defaulting back to pencilblue.
        if (!pb.validation.validateNonEmptyStr(uidAndTemplate, true)) {
            var defautTemplatePath = this.getDefaultTemplatePath();
            pb.log.silly("ContentController: No template specified, defaulting to %s.", defautTemplatePath);
            return cb(null, defautTemplatePath);
        }

        //we now know that the template was specified.  We have to split the value
        //to extract the intended theme and the template path
        var pieces = uidAndTemplate.split('|');

        //for backward compatibility we let the template service determine where to
        //find the template when no template is specified.  This mostly catches the
        //default case of "index"
        if (pieces.length === 1) {

            pb.log.silly("ContentController: No theme specified, Template Service will delegate [%s]", pieces[0]);
            return cb(null, pieces[0]);
        }
        else if (pieces.length <= 0) {

            //shit's broke. This should never be the case but better safe than sorry
            return cb(new Error("The content's template property provided an invalid value of ["+content.template+']'), null);
        }

        //the theme is specified, we ensure that the theme is installed and
        //initialized otherwise we let the template service figure out how to
        //delegate.
        if (!pb.PluginService.isActivePlugin(pieces[0])) {
            pb.log.silly("ContentController: Theme [%s] is not active, Template Service will delegate [%s]", pieces[0], pieces[1]);
            return cb(null, pieces[1]);
        }

        //the theme is OK. We don't gaurantee that the template is on the disk but we can testify that it SHOULD.  We set the
        //prioritized theme for the template service.
        pb.log.silly("ContentController: Prioritizing Theme [%s] for template [%s]", pieces[0], pieces[1]);
        this.ts.setTheme(pieces[0]);
        cb(null, pieces[1]);
    };

    /**
     *
     * @method getDefaultTemplatePath
     * @return {String}
     */
    ContentViewLoader.prototype.getDefaultTemplatePath = function() {
        return 'index';
    };

    /**
     *
     * @method onContent
     * @param {Array} contentArray
     * @param {Object} options
     * @param {Function} cb
     */
    ContentViewLoader.prototype.onContent = function(contentArray, options, cb) {
        var self  = this;
        var limit = Math.min(this.contentSettings.articles_per_page, contentArray.length);

        var tasks = util.getTasks(contentArray, function(contentArray, i) {
            return function(callback) {
                if (i >= limit) {
                    return callback(null, '');
                }
                self.renderContent(contentArray[i], options, callback);
            };
        });
        async.series(tasks, function(err, content) {
            cb(err, new pb.TemplateValue(content.join(''), false));
        });
    };

    /**
     *
     * @method gatherData
     * @param {Array} contentArray
     * @param {Object} options
     * @param {Function} cb
     */
    ContentViewLoader.prototype.gatherData = function(contentArray, options, cb) {
        var self  = this;
        var tasks = {

            //navigation
            nav: function(callback) {

                var opts = {
                    currUrl: self.req.url,
                    session: self.session,
                    ls: self.ls,
                    site: self.site,
                    activeTheme: self.activeTheme
                };
                var topMenuService = new pb.TopMenuService();
                topMenuService.getNavItems(opts, callback);
            },

            meta: function(callback) {
                self.getMetaInfo(contentArray, options, callback);
            },

            contentSettings: function(callback) {
                if (util.isObject(self.contentSettings)) {
                    return callback(null, self.contentSettings);
                }

                var contentService = new pb.ContentService({site: self.site, onlyThisSite: self.onlyThisSite});
                contentService.getSettings(function(err, contentSettings) {
                    self.contentSettings = contentSettings;
                    callback(err, contentSettings);
                });
            }
        };
        async.parallel(tasks, cb);
    };

    /**
     *
     * @method onAngular
     * @param {Array} contentArray
     * @param {Object} options
     * @param {Function} cb
     */
    ContentViewLoader.prototype.onAngular = function(contentArray, options, cb) {
        var objects = {
            trustHTML: 'function(string){return $sce.trustAsHtml(string);}'
        };
        var angularData = pb.ClientJs.getAngularController(objects, ['ngSanitize']);
        cb(null, angularData);
    };

    /**
     *
     * @method onPageName
     * @param {Array} contentArray
     * @param {Object} options
     * @param {Function} cb
     */
    ContentViewLoader.prototype.onPageName = function(contentArray, options, cb) {
        var content = contentArray[0];
        if (!util.isObject(content)) {
            return cb(null, options.metaTitle || this.siteObj.displayName);
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

        cb(null, name ? name + ' | ' + this.siteObj.displayName : this.siteObj.displayName);
    };

    /**
     *
     * @method onInfiniteScroll
     * @param {Array} contentArray
     * @param {Object} options
     * @param {Function} cb
     */
    ContentViewLoader.prototype.onInfiniteScroll = function(contentArray, options, cb) {
        if(contentArray.length <= 1) {
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

    /**
     *
     * @method setMetaInfo
     * @param {Object} options
     */
    ContentViewLoader.prototype.setMetaInfo = function(meta, options) {
        this.ts.registerLocal('meta_keywords', meta.keywords);
        this.ts.registerLocal('meta_desc', options.metaDescription || meta.description);
        this.ts.registerLocal('meta_title', options.metaTitle || meta.title);
        this.ts.registerLocal('meta_thumbnail', meta.thumbnail || '');
        this.ts.registerLocal('meta_lang', options.metaLang || this.ls.language);
    };

    /**
     *
     * @method getMetaInfo
     * @param {Array} contentArray
     * @param {Object} options
     * @param {Function} cb
     */
    ContentViewLoader.prototype.getMetaInfo = function(contentArray, options, cb) {
        if (contentArray.length === 0) {
            return cb(null, {});
        }
        this.service.getMetaInfo(contentArray[0], cb);
    };

    /**
     *
     * @method renderContent
     * @param {Object} content
     * @param {Object} options
     * @param {Function} cb
     */
    ContentViewLoader.prototype.renderContent = function(content, options, cb) {
        var self = this;

        //set recurring params
        if (util.isNullOrUndefined(options.contentIndex)) {
            options.contentIndex = 0;
        }

        var isPage           = this.service.getType() === 'page';
        var showByLine       = this.contentSettings.display_bylines && !isPage;
        var showTimestamp    = this.contentSettings.display_timestamp && !isPage;
        var ats              = self.ts.getChildInstance();
        var contentUrlPrefix = '/' + this.service.getType() + '/';
        self.ts.reprocess = false;
        ats.registerLocal('article_permalink', function(flag, cb) {
            self.onContentPermalink(content, options, cb);
        });
        ats.registerLocal('article_headline', function(flag, cb) {
            self.onContentHeadline(content, options, cb);
        });
        ats.registerLocal('article_headline_nolink', content.headline);
        ats.registerLocal('article_subheading', ContentViewLoader.valOrEmpty(content.subheading));
        ats.registerLocal('article_subheading_display', ContentViewLoader.getDisplayAttr(content.subheading));
        ats.registerLocal('article_id', content[pb.DAO.getIdField()] + '');
        ats.registerLocal('article_index', options.contentIndex);
        ats.registerLocal('article_timestamp', showTimestamp && content.timestamp ? content.timestamp : '');
        ats.registerLocal('article_timestamp_display', ContentViewLoader.getDisplayAttr(showTimestamp));
        ats.registerLocal('article_layout', new pb.TemplateValue(content.layout, false));
        ats.registerLocal('article_url', content.url);
        ats.registerLocal('display_byline', ContentViewLoader.getDisplayAttr(showByLine));
        ats.registerLocal('author_photo', ContentViewLoader.valOrEmpty(content.author_photo));
        ats.registerLocal('author_photo_display', ContentViewLoader.getDisplayAttr(content.author_photo));
        ats.registerLocal('author_name', ContentViewLoader.valOrEmpty(content.author_name));
        ats.registerLocal('author_position', ContentViewLoader.valOrEmpty(content.author_position));
        ats.registerLocal('media_body_style', ContentViewLoader.valOrEmpty(content.media_body_style));
        ats.registerLocal('comments', function(flag, cb) {
            if (isPage || !pb.ArticleService.allowComments(self.contentSettings, content)) {
                return cb(null, '');
            }

            var ts = ats.getChildInstance();
            self.renderComments(content, ts, function(err, comments) {
                cb(err, new pb.TemplateValue(comments, false));
            });
        });
        ats.load(self.getDefaultContentTemplatePath(), cb);

        options.contentIndex++;
    };

    /**
     *
     * @method getDefaultContentTemplatePath
     * @return {String}
     */
    ContentViewLoader.prototype.getDefaultContentTemplatePath = function() {
        return 'elements/article';
    };

    /**
     *
     * @method renderComments
     * @param {Object} content
     * @param {TemplateService} ts
     * @param {Function} cb
     */
    ContentViewLoader.prototype.renderComments = function(content, ts, cb) {
        var self           = this;
        var commentingUser = null;
        if(pb.security.isAuthenticated(this.session)) {
            commentingUser = this.commentService.getCommentingUser(this.session.authentication.user);
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
            if (!util.isArray(content.comments) || content.comments.length === 0) {
                return cb(null, '');
            }

            var tasks = util.getTasks(content.comments, function(comments, i) {
                return function(callback) {

                    var cts = ts.getChildInstance();
                    self.renderComment(comments[i], cts, callback);
                };
            });
            async.parallel(tasks, function(err, results) {
                cb(err, new pb.TemplateValue(results.join(''), false));
            });
        });
        ts.load(self.getDefaultCommentsTemplatePath(), cb);
    };

    /**
     *
     * @method getDefaultCommentsTemplatePath
     * @return {String}
     */
    ContentViewLoader.prototype.getDefaultCommentsTemplatePath = function() {
        return 'elements/comments';
    };

    /**
     *
     * @method renderComment
     * @param {Object} comment
     * @param {TemplateService} cts
     * @param {Function} cb
     */
    ContentViewLoader.prototype.renderComment = function(comment, cts, cb) {

        cts.reprocess = false;
        cts.registerLocal('commenter_photo', comment.commenter_photo ? comment.commenter_photo : '');
        cts.registerLocal('display_photo', comment.commenter_photo ? 'block' : 'none');
        cts.registerLocal('commenter_name', comment.commenter_name);
        cts.registerLocal('commenter_position', comment.commenter_position ? ', ' + comment.commenter_position : '');
        cts.registerLocal('content', comment.content);
        cts.registerLocal('timestamp', comment.timestamp);
        cts.load(this.getDefaultCommentTemplatePath(), cb);
    };

    /**
     *
     * @method getDefaultCommentTemplatePath
     * @return {String}
     */
    ContentViewLoader.prototype.getDefaultCommentTemplatePath = function() {
        return 'elements/comments/comment';
    };

    /**
     *
     * @method onCommentingUserPhoto
     * @param {Object} content
     * @param {Object} commentingUser
     * @param {Function} cb
     */
    ContentViewLoader.prototype.onCommentingUserPhoto = function(content, commentingUser, cb) {
        var val = '';
        if (commentingUser) {
            val = commentingUser.photo || '';
        }
        cb(null, val);
    };

    /**
     *
     * @method onCommentingUserPosition
     * @param {Object} content
     * @param {Object} options
     * @param {Function} cb
     */
    ContentViewLoader.prototype.onCommentingUserPosition = function(content, commentingUser, cb) {
        var val = '';
        if (commentingUser && util.isArray(commentingUser.position) && commentingUser.position.length > 0) {
            val = ', ' + commentingUser.position;
        }
        cb(null, val);
    };

    /**
     *
     * @method onContentPermalink
     * @param {Object} content
     * @param {Object} options
     * @param {Function} cb
     */
    ContentViewLoader.prototype.onContentPermalink = function(content, options, cb) {
        cb(null, this.createContentPermalink(content));
    };

    /**
     *
     * @method onContentHeadline
     * @param {Object} content
     * @param {Object} options
     * @param {Function} cb
     */
    ContentViewLoader.prototype.onContentHeadline = function(content, options, cb) {
        var url = this.createContentPermalink(content);
        var val = new pb.TemplateValue('<a href="' + url + '">' + HtmlEncoder.htmlEncode(content.headline) + '</a>', false);
        cb(null, val);
    };

    /**
     *
     * @method createContentPermalink
     * @param {Object} content
     * @return {String}
     */
    ContentViewLoader.prototype.createContentPermalink = function(content) {
        var prefix = '/' + this.service.getType();
        return pb.UrlService.createSystemUrl(pb.UrlService.urlJoin(prefix, content.url), { hostname: this.hostname });
    };

    /**
     *
     * @static
     * @method getDisplayAttr
     * @param {*} val
     * @return {String}
     */
    ContentViewLoader.getDisplayAttr = function(val) {
        return val ? '' : DISPLAY_NONE_STYLE_ATTR;
    };

    /**
     * When passed a value it is evaluated as a boolean.  If evaluated to TRUE
     * the value is returned, if FALSE empty string is returned
     * @static
     * @method valOrEmpty
     * @param {*} val
     * @return {*}
     */
    ContentViewLoader.valOrEmpty = function(val) {
        return val ? val : '';
    };

    return ContentViewLoader;
};
