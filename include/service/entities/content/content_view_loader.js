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
'use strict';

//dependencies
const _ = require('lodash');
const ActivePluginService = require('../../../../lib/service/plugins/activePluginService');
const async       = require('async');
const ClientJs = require('../../../client_js');
const CommentService = require('../../../theme/comments');
const ContentService = require('../../../content');
const DAO = require('../../../dao/dao');
const HtmlEncoder = require('htmlencode');
const log = require('../../../utils/logging').newInstance('ContentViewLoader');
const SecurityService = require('../../../access_management');
const TemplateValue = require('../template_service').TemplateValue;
const TopMenuService = require('../../../theme/top_menu');
const UrlUtils = require('../../../../lib/utils/urlUtils');
const ValidationService = require('../../../validation/validation_service');

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
class ContentViewLoader {
    constructor(context) {
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
        this.commentService = context.commentService;
    }

    /**
     *
     * @private
     * @static
     * @property DISPLAY_NONE_STYLE_ATTR
     * @type {String}
     */
    static get DISPLAY_NONE_STYLE_ATTR() {
        return 'display:none;';
    }

    /**
     *
     * @method renderSingle
     * @param {Object} content
     * @param {Object} options
     * @param {Function} cb
     */
    renderSingle(content, options, cb) {
        this.render([content], options, cb);
    }

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
    render(contentArray, options, cb) {
        var self = this;

        this.gatherData(contentArray, options, function (err, data) {
            if (_.isError(err)) {
                return cb(err);
            }

            self.setMetaInfo(data.meta, options);
            self.ts.registerLocal('current_url', self.req.url);
            self.ts.registerLocal('navigation', new TemplateValue(data.nav.navigation, false));
            self.ts.registerLocal('account_buttons', new TemplateValue(data.nav.accountButtons, false));
            self.ts.registerLocal('infinite_scroll', function (flag, cb) {
                self.onInfiniteScroll(contentArray, options, cb);
            });
            self.ts.registerLocal('page_name', function (flag, cb) {
                self.onPageName(contentArray, options, cb);
            });
            self.ts.registerLocal('angular', function (flag, cb) {
                self.onAngular(contentArray, options, cb);
            });
            self.ts.registerLocal('articles', function (flag, cb) {
                self.onContent(contentArray, options, cb);
            });

            self.getTemplate(contentArray, options, function (err, template) {
                if (_.isError(err)) {
                    return cb(err);
                }

                self.ts.load(template, cb);
            });
        });
    }

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
    getTemplate(content, options, cb) {

        //check if we should just use whatever default there is.
        //this could fall back to an active theme or the default pencilblue theme.
        if (options.useDefaultTemplate || _.isObject(options.topic) || _.isObject(options.section)) {
            return cb(null, this.getDefaultTemplatePath());
        }

        //now we are dealing with a single page or article. the template will be
        //judged based off the article's preference.
        if (Array.isArray(content) && content.length > 0) {
            content = content[0];
        }
        var uidAndTemplate = content.template;

        //when no template is specified or is empty we no that the article has no
        //preference and we can fall back on the default (index).  We depend on the
        //template service to determine who has priority based on the active theme
        //then defaulting back to pencilblue.
        if (!ValidationService.isNonEmptyStr(uidAndTemplate, true)) {
            var defautTemplatePath = this.getDefaultTemplatePath();
            log.silly("ContentController: No template specified, defaulting to %s.", defautTemplatePath);
            return cb(null, defautTemplatePath);
        }

        //we now know that the template was specified.  We have to split the value
        //to extract the intended theme and the template path
        var pieces = uidAndTemplate.split('|');

        //for backward compatibility we let the template service determine where to
        //find the template when no template is specified.  This mostly catches the
        //default case of "index"
        if (pieces.length === 1) {

            log.silly("ContentController: No theme specified, Template Service will delegate [%s]", pieces[0]);
            return cb(null, pieces[0]);
        }
        else if (pieces.length <= 0) {

            //shit's broke. This should never be the case but better safe than sorry
            return cb(new Error("The content's template property provided an invalid value of [" + content.template + ']'), null);
        }

        //the theme is specified, we ensure that the theme is installed and
        //initialized otherwise we let the template service figure out how to
        //delegate.
        if (!ActivePluginService.isActivePlugin(pieces[0])) {
            log.silly("ContentController: Theme [%s] is not active, Template Service will delegate [%s]", pieces[0], pieces[1]);
            return cb(null, pieces[1]);
        }

        //the theme is OK. We don't gaurantee that the template is on the disk but we can testify that it SHOULD.  We set the
        //prioritized theme for the template service.
        log.silly("ContentController: Prioritizing Theme [%s] for template [%s]", pieces[0], pieces[1]);
        this.ts.setTheme(pieces[0]);
        cb(null, pieces[1]);
    }

    /**
     *
     * @method getDefaultTemplatePath
     * @return {String}
     */
    getDefaultTemplatePath() {
        return 'index';
    }

    /**
     *
     * @method onContent
     * @param {Array} contentArray
     * @param {Object} options
     * @param {Function} cb
     */
    onContent(contentArray, options, cb) {
        var self = this;
        var limit = Math.min(this.contentSettings.articles_per_page, contentArray.length);

        var tasks = contentArray.map(function (content, i) {
            return function (callback) {
                if (i >= limit) {
                    return callback(null, '');
                }
                self.renderContent(content, options, callback);
            };
        });
        async.series(tasks, function (err, content) {
            cb(err, new TemplateValue(content.join(''), false));
        });
    }

    /**
     *
     * @method gatherData
     * @param {Array} contentArray
     * @param {Object} options
     * @param {Function} cb
     */
    gatherData(contentArray, options, cb) {
        var self = this;
        var tasks = {

            //navigation
            nav: function (callback) {

                var opts = {
                    currUrl: self.req.url,
                    session: self.session,
                    ls: self.ls,
                    site: self.site,
                    activeTheme: self.activeTheme
                };
                var topMenuService = new TopMenuService();
                topMenuService.getNavItems(opts, callback);
            },

            meta: function (callback) {
                self.getMetaInfo(contentArray, options, callback);
            },

            contentSettings: function (callback) {
                if (_.isObject(self.contentSettings)) {
                    return callback(null, self.contentSettings);
                }

                var contentService = new ContentService({site: self.site, onlyThisSite: self.onlyThisSite});
                contentService.getSettings(function (err, contentSettings) {
                    self.contentSettings = contentSettings;
                    callback(err, contentSettings);
                });
            }
        };
        async.parallel(tasks, cb);
    }

    /**
     *
     * @method onAngular
     * @param {Array} contentArray
     * @param {Object} options
     * @param {Function} cb
     */
    onAngular(contentArray, options, cb) {
        var objects = {
            trustHTML: 'function(string){return $sce.trustAsHtml(string);}'
        };
        var angularData = ClientJs.getAngularController(objects, ['ngSanitize']);
        cb(null, angularData);
    }

    /**
     *
     * @method onPageName
     * @param {Array} contentArray
     * @param {Object} options
     * @param {Function} cb
     */
    onPageName(contentArray, options, cb) {
        var content = contentArray[0];
        if (!_.isObject(content)) {
            return cb(null, options.metaTitle || this.siteObj.displayName);
        }

        var name = '';
        if (_.isObject(options.section)) {
            name = options.section.name;
        }
        else if (_.isObject(options.topic)) {
            name = options.topic.name;
        }
        else if (contentArray.length === 1) {
            name = content.headline;
        }
        else {
            name = options.metaTitle || '';
        }

        cb(null, name ? name + ' | ' + this.siteObj.displayName : this.siteObj.displayName);
    }

    /**
     *
     * @method onInfiniteScroll
     * @param {Array} contentArray
     * @param {Object} options
     * @param {Function} cb
     */
    onInfiniteScroll(contentArray, options, cb) {
        if (contentArray.length <= 1) {
            return cb(null, '');
        }

        var infiniteScrollScript = ClientJs.includeJS('/js/infinite_article_scroll.js');
        if (_.isObject(options.section)) {
            infiniteScrollScript += ClientJs.getJSTag('var infiniteScrollSection = "' + options.section[DAO.getIdField()] + '";');
        }
        else if (_.isObject(options.topic)) {
            infiniteScrollScript += ClientJs.getJSTag('var infiniteScrollTopic = "' + options.topic.topic[DAO.getIdField()] + '";');
        }

        var val = new TemplateValue(infiniteScrollScript, false);
        cb(null, val);
    }

    /**
     *
     * @method setMetaInfo
     * @param {Object} options
     */
    setMetaInfo(meta, options) {
        this.ts.registerLocal('meta_keywords', meta.keywords);
        this.ts.registerLocal('meta_desc', options.metaDescription || meta.description);
        this.ts.registerLocal('meta_title', options.metaTitle || meta.title);
        this.ts.registerLocal('meta_thumbnail', meta.thumbnail || '');
        this.ts.registerLocal('meta_lang', options.metaLang || this.ls.language);
    }

    /**
     *
     * @method getMetaInfo
     * @param {Array} contentArray
     * @param {Object} options
     * @param {Function} cb
     */
    getMetaInfo(contentArray, options, cb) {
        if (contentArray.length === 0) {
            return cb(null, {});
        }
        this.service.getMetaInfo(contentArray[0], cb);
    }

    /**
     *
     * @method renderContent
     * @param {Object} content
     * @param {Object} options
     * @param {Function} cb
     */
    renderContent(content, options, cb) {
        var self = this;

        //set recurring params
        if (_.isNil(options.contentIndex)) {
            options.contentIndex = 0;
        }

        var isPage = this.service.getType() === 'page';
        var showByLine = this.contentSettings.display_bylines && !isPage;
        var showTimestamp = this.contentSettings.display_timestamp && !isPage;
        var ats = self.ts.getChildInstance();
        var contentUrlPrefix = '/' + this.service.getType() + '/';
        self.ts.reprocess = false;
        ats.registerLocal('article_permalink', function (flag, cb) {
            self.onContentPermalink(content, options, cb);
        });
        ats.registerLocal('article_headline', function (flag, cb) {
            self.onContentHeadline(content, options, cb);
        });
        ats.registerLocal('article_headline_nolink', content.headline);
        ats.registerLocal('article_subheading', ContentViewLoader.valOrEmpty(content.subheading));
        ats.registerLocal('article_subheading_display', ContentViewLoader.getDisplayAttr(content.subheading));
        ats.registerLocal('article_id', content[DAO.getIdField()] + '');
        ats.registerLocal('article_index', options.contentIndex);
        ats.registerLocal('article_timestamp', showTimestamp && content.timestamp ? content.timestamp : '');
        ats.registerLocal('article_timestamp_display', ContentViewLoader.getDisplayAttr(showTimestamp));
        ats.registerLocal('article_layout', new TemplateValue(content.layout, false));
        ats.registerLocal('article_url', content.url);
        ats.registerLocal('display_byline', ContentViewLoader.getDisplayAttr(showByLine));
        ats.registerLocal('author_photo', ContentViewLoader.valOrEmpty(content.author_photo));
        ats.registerLocal('author_photo_display', ContentViewLoader.getDisplayAttr(content.author_photo));
        ats.registerLocal('author_name', ContentViewLoader.valOrEmpty(content.author_name));
        ats.registerLocal('author_position', ContentViewLoader.valOrEmpty(content.author_position));
        ats.registerLocal('media_body_style', ContentViewLoader.valOrEmpty(content.media_body_style));
        ats.registerLocal('comments', function (flag, cb) {
            if (isPage || !ContentService.allowComments(self.contentSettings, content)) {
                return cb(null, '');
            }

            var ts = ats.getChildInstance();
            self.renderComments(content, ts, function (err, comments) {
                cb(err, new TemplateValue(comments, false));
            });
        });
        ats.load(self.getDefaultContentTemplatePath(), cb);

        options.contentIndex++;
    }

    /**
     *
     * @method getDefaultContentTemplatePath
     * @return {String}
     */
    getDefaultContentTemplatePath() {
        return 'elements/article';
    }

    /**
     *
     * @method renderComments
     * @param {Object} content
     * @param {TemplateService} ts
     * @param {Function} cb
     */
    renderComments(content, ts, cb) {
        var self = this;
        var commentingUser = null;
        if (SecurityService.isAuthenticated(this.session)) {
            commentingUser = this.commentService.getCommentingUser(this.session.authentication.user);
        }

        ts.registerLocal('user_photo', function (flag, cb) {
            self.onCommentingUserPhoto(content, commentingUser, cb);
        });
        ts.registerLocal('user_position', function (flag, cb) {
            self.onCommentingUserPosition(content, commentingUser, cb);
        });
        ts.registerLocal('user_name', commentingUser ? commentingUser.name : '');
        ts.registerLocal('display_submit', commentingUser ? 'block' : 'none');
        ts.registerLocal('display_login', commentingUser ? 'none' : 'block');
        ts.registerLocal('comments_length', Array.isArray(content.comments) ? content.comments.length : 0);
        ts.registerLocal('individual_comments', function (flag, cb) {
            if (!Array.isArray(content.comments) || content.comments.length === 0) {
                return cb(null, '');
            }

            var tasks = content.comments.map(function (comment) {
                return function (callback) {

                    var cts = ts.getChildInstance();
                    self.renderComment(comment, cts, callback);
                };
            });
            async.parallel(tasks, function (err, results) {
                cb(err, new TemplateValue(results.join(''), false));
            });
        });
        ts.load(self.getDefaultCommentsTemplatePath(), cb);
    }

    /**
     *
     * @method getDefaultCommentsTemplatePath
     * @return {String}
     */
    getDefaultCommentsTemplatePath() {
        return 'elements/comments';
    }

    /**
     *
     * @method renderComment
     * @param {Object} comment
     * @param {TemplateService} cts
     * @param {Function} cb
     */
    renderComment(comment, cts, cb) {

        cts.reprocess = false;
        cts.registerLocal('commenter_photo', comment.commenter_photo ? comment.commenter_photo : '');
        cts.registerLocal('display_photo', comment.commenter_photo ? 'block' : 'none');
        cts.registerLocal('commenter_name', comment.commenter_name);
        cts.registerLocal('commenter_position', comment.commenter_position ? ', ' + comment.commenter_position : '');
        cts.registerLocal('content', comment.content);
        cts.registerLocal('timestamp', comment.timestamp);
        cts.load(this.getDefaultCommentTemplatePath(), cb);
    }

    /**
     *
     * @method getDefaultCommentTemplatePath
     * @return {String}
     */
    getDefaultCommentTemplatePath() {
        return 'elements/comments/comment';
    }

    /**
     *
     * @method onCommentingUserPhoto
     * @param {Object} content
     * @param {Object} commentingUser
     * @param {Function} cb
     */
    onCommentingUserPhoto(content, commentingUser, cb) {
        var val = '';
        if (commentingUser) {
            val = commentingUser.photo || '';
        }
        cb(null, val);
    }

    /**
     *
     * @method onCommentingUserPosition
     * @param {Object} content
     * @param {Object} options
     * @param {Function} cb
     */
    onCommentingUserPosition(content, commentingUser, cb) {
        var val = '';
        if (commentingUser && Array.isArray(commentingUser.position) && commentingUser.position.length > 0) {
            val = ', ' + commentingUser.position;
        }
        cb(null, val);
    }

    /**
     *
     * @method onContentPermalink
     * @param {Object} content
     * @param {Object} options
     * @param {Function} cb
     */
    onContentPermalink(content, options, cb) {
        cb(null, this.createContentPermalink(content));
    }

    /**
     *
     * @method onContentHeadline
     * @param {Object} content
     * @param {Object} options
     * @param {Function} cb
     */
    onContentHeadline(content, options, cb) {
        var url = this.createContentPermalink(content);
        var val = new TemplateValue('<a href="' + url + '">' + HtmlEncoder.htmlEncode(content.headline) + '</a>', false);
        cb(null, val);
    }

    /**
     *
     * @method createContentPermalink
     * @param {Object} content
     * @return {String}
     */
    createContentPermalink(content) {
        var prefix = '/' + this.service.getType();
        return UrlUtils.createSystemUrl(UrlUtils.join(prefix, content.url), {hostname: this.hostname});
    }

    /**
     *
     * @static
     * @method getDisplayAttr
     * @param {*} val
     * @return {String}
     */
    static getDisplayAttr(val) {
        return val ? '' : ContentViewLoader.DISPLAY_NONE_STYLE_ATTR;
    }

    /**
     * When passed a value it is evaluated as a boolean.  If evaluated to TRUE
     * the value is returned, if FALSE empty string is returned
     * @static
     * @method valOrEmpty
     * @param {*} val
     * @return {*}
     */
    static valOrEmpty(val) {
        return val ? val : '';
    }
}

module.exports = ContentViewLoader;
