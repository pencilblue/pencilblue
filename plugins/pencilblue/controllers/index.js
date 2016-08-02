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
var path  = require('path');
var async = require('async');

module.exports = function IndexModule(pb) {

    //pb dependencies
    var util           = pb.util;
    var TopMenu        = pb.TopMenuService;
    var Comments       = pb.CommentService;
    var ArticleService = pb.ArticleService;
    var CommentService = pb.CommentService;

    /**
     * Index page of the pencilblue theme
     * @deprecated Since 0.4.1
     * @class Index
     * @constructor
     * @extends BaseController
     */
    function Index(){}
    util.inherits(Index, pb.BaseController);

    Index.prototype.initSync = function (/*context*/) {
        this.siteQueryService = new pb.SiteQueryService({site: this.site, onlyThisSite: true});
        this.commentService = new CommentService(this.getServiceContext());
    };

    Index.prototype.render = function(cb) {
        var self = this;

        //determine and execute the proper call
        var section = self.req.pencilblue_section || null;
        var topic   = self.req.pencilblue_topic   || null;
        var article = self.req.pencilblue_article || null;
        var page    = self.req.pencilblue_page    || null;

        var contentService = new pb.ContentService({site: self.site, onlyThisSite: true});
        contentService.getSettings(function(err, contentSettings) {
            self.gatherData(function(err, data) {

                var articleService = new pb.ArticleService(self.site, true);
                articleService.getMetaInfo(data.content[0], function(err, meta) {
                    self.ts.registerLocal('meta_keywords', meta.keywords);
                    self.ts.registerLocal('meta_desc', data.section.description || meta.description);
                    self.ts.registerLocal('meta_title', data.section.name || meta.title);
                    self.ts.registerLocal('meta_thumbnail', meta.thumbnail);
                    self.ts.registerLocal('meta_lang', self.ls.language);
                    self.ts.registerLocal('current_url', self.req.url);
                    self.ts.registerLocal('navigation', new pb.TemplateValue(data.nav.navigation, false));
                    self.ts.registerLocal('account_buttons', new pb.TemplateValue(data.nav.accountButtons, false));
                    self.ts.registerLocal('infinite_scroll', function(flag, cb) {
                        if(article || page) {
                            cb(null, '');
                        }
                        else {
                            var infiniteScrollScript = pb.ClientJs.includeJS('/js/infinite_article_scroll.js');
                            if(section) {
                                infiniteScrollScript += pb.ClientJs.getJSTag('var infiniteScrollSection = "' + section + '";');
                            }
                            else if(topic) {
                                infiniteScrollScript += pb.ClientJs.getJSTag('var infiniteScrollTopic = "' + topic + '";');
                            }

                            var val = new pb.TemplateValue(infiniteScrollScript, false);
                            cb(null, val);
                        }
                    });
                    self.ts.registerLocal('articles', function(flag, cb) {
                        var tasks = util.getTasks(data.content, function(content, i) {
                            return function(callback) {
                                if (i >= contentSettings.articles_per_page) {//TODO, limit articles in query, not through hackery
                                    callback(null, '');
                                    return;
                                }
                                self.renderContent(content[i], contentSettings, data.nav.themeSettings, i, callback);
                            };
                        });
                        async.parallel(tasks, function(err, result) {
                            cb(err, new pb.TemplateValue(result.join(''), false));
                        });
                    });
                    self.ts.registerLocal('page_name', function(flag, cb) {
                        var content = data.content.length > 0 ? data.content[0] : null;
                        self.getContentSpecificPageName(content, cb);
                    });
                    self.ts.registerLocal('angular', function(flag, cb) {

                        var objects = {
                            trustHTML: 'function(string){return $sce.trustAsHtml(string);}'
                        };
                        var angularData = pb.ClientJs.getAngularController(objects, ['ngSanitize']);
                        cb(null, angularData);
                    });
                    self.getTemplate(data.content, function(err, template) {
                        if (util.isError(err)) {
                            return cb(err);
                        }

                        self.ts.load(template, function(err, result) {
                            if (util.isError(err)) {
                                return cb(err);
                            }

                            cb({content: result});
                        });
                    });
                });
            });
        });
    };


    Index.prototype.getTemplate = function(content, cb) {

        //check if we should just use whatever default there is.
        //this could fall back to an active theme or the default pencilblue theme.
        if (!this.req.pencilblue_article && !this.req.pencilblue_page) {
            cb(null, this.getDefaultTemplatePath());
            return;
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
            cb(null, defautTemplatePath);
            return;
        }

        //we now know that the template was specified.  We have to split the value
        //to extract the intended theme and the template path
        var pieces = uidAndTemplate.split('|');

        //for backward compatibility we let the template service determine where to
        //find the template when no template is specified.  This mostly catches the
        //default case of "index"
        if (pieces.length === 1) {

            pb.log.silly("ContentController: No theme specified, Template Service will delegate [%s]", pieces[0]);
            cb(null, pieces[0]);
            return;
        }
        else if (pieces.length <= 0) {

            //shit's broke. This should never be the case but better safe than sorry
            cb(new Error("The content's template property provided an invalid value of ["+content.template+']'), null);
            return;
        }

        //the theme is specified, we ensure that the theme is installed and
        //initialized otherwise we let the template service figure out how to
        //delegate.
        if (!pb.PluginService.isActivePlugin(pieces[0], this.site)) {
            pb.log.silly("ContentController: Theme [%s] is not active, Template Service will delegate [%s]", pieces[0], pieces[1]);
            cb(null, pieces[1]);
            return;
        }

        //the theme is OK. We don't gaurantee that the template is on the disk but we can testify that it SHOULD.  We set the
        //prioritized theme for the template service.
        pb.log.silly("ContentController: Prioritizing Theme [%s] for template [%s]", pieces[0], pieces[1]);
        this.ts.setTheme(pieces[0]);
        cb(null, pieces[1]);
    };

    Index.prototype.getDefaultTemplatePath = function() {
        return 'index';
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
            },

            section: function(callback) {
                if(!self.req.pencilblue_section) {
                    callback(null, {});
                    return;
                }

                var dao = new pb.DAO();
                dao.loadById(self.req.pencilblue_section, 'section', callback);
            }
        };
        async.parallel(tasks, cb);
    };

    Index.prototype.loadContent = function(articleCallback) {

        var section = this.req.pencilblue_section || null;
        var topic   = this.req.pencilblue_topic   || null;
        var article = this.req.pencilblue_article || null;
        var page    = this.req.pencilblue_page    || null;

        //get service context
        var opts = this.getServiceContext();

        var service = new ArticleService(this.site, true);
        if(this.req.pencilblue_preview) {
            if(this.req.pencilblue_preview === page || article) {
                if(page) {
                    service.setContentType('page');
                }
                var where = pb.DAO.getIdWhere(page || article);
                where.draft = {$exists: true};
                where.publish_date = {$exists: true};
                service.find(where, opts, articleCallback);
            }
            else {
                service.find({}, opts, articleCallback);
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
            service.find({}, opts, articleCallback);
        }
    };

    Index.prototype.renderContent = function(content, contentSettings, themeSettings, index, cb) {
        var self = this;

        var isPage           = content.object_type === 'page';
        var showByLine       = contentSettings.display_bylines && !isPage;
        var showTimestamp    = contentSettings.display_timestamp && !isPage;


        var ats              = this.ts.getChildInstance();
        var contentUrlPrefix = isPage ? '/page/' : '/article/';
        self.ts.reprocess = false;
        ats.registerLocal('article_permalink', pb.UrlService.urlJoin(pb.config.siteRoot, contentUrlPrefix, content.url));
        ats.registerLocal('article_headline', new pb.TemplateValue('<a href="' + pb.UrlService.urlJoin(contentUrlPrefix, content.url) + '">' + content.headline + '</a>', false));
        ats.registerLocal('article_headline_nolink', content.headline);
        ats.registerLocal('article_subheading', content.subheading ? content.subheading : '');
        ats.registerLocal('article_subheading_display', content.subheading ? '' : 'display:none;');
        ats.registerLocal('article_id', content[pb.DAO.getIdField()].toString());
        ats.registerLocal('article_index', index);
        ats.registerLocal('article_timestamp', showTimestamp && content.timestamp ? content.timestamp : '');
        ats.registerLocal('article_timestamp_display', showTimestamp ? '' : 'display:none;');
        ats.registerLocal('article_layout', new pb.TemplateValue(content.layout, false));
        ats.registerLocal('article_url', content.url);
        ats.registerLocal('display_byline', showByLine ? '' : 'display:none;');
        ats.registerLocal('author_photo', content.author_photo ? content.author_photo : '');
        ats.registerLocal('author_photo_display', content.author_photo ? '' : 'display:none;');
        ats.registerLocal('author_name', content.author_name ? content.author_name : '');
        ats.registerLocal('author_position', content.author_position ? content.author_position : '');
        ats.registerLocal('media_body_style', content.media_body_style ? content.media_body_style : '');
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

    Index.prototype.renderComments = function(content, ts, cb) {
        var self           = this;
        var commentingUser = null;
        if(pb.security.isAuthenticated(this.session)) {
            commentingUser = self.commentService.getCommentingUser(this.session.authentication.user);
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
            if (!util.isArray(content.comments) || content.comments.length === 0) {
                cb(null, '');
                return;
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

    Index.prototype.renderComment = function(comment, cb) {

        var cts = this.ts.getChildInstance();
        cts.reprocess = false;
        cts.registerLocal('commenter_photo', comment.commenter_photo ? comment.commenter_photo : '');
        cts.registerLocal('display_photo', comment.commenter_photo ? 'block' : 'none');
        cts.registerLocal('commenter_name', comment.commenter_name);
        cts.registerLocal('commenter_position', comment.commenter_position ? ', ' + comment.commenter_position : '');
        cts.registerLocal('content', comment.content);
        cts.registerLocal('timestamp', comment.timestamp);
        cts.load('elements/comments/comment', cb);
    };

    Index.prototype.getContentSpecificPageName = function(content, cb) {
        if (!content) {
            cb(null, pb.config.siteName);
            return;
        }

        if(this.req.pencilblue_article || this.req.pencilblue_page) {
            cb(null, content.headline + ' | ' + pb.config.siteName);
        }
        else if(this.req.pencilblue_section || this.req.pencilblue_topic) {

            var objType = this.req.pencilblue_section ? 'section' : 'topic';
            var dao     = new pb.DAO();
            dao.loadById(this.req.pencilblue_section, objType, function(err, obj) {
                if(util.isError(err) || obj === null) {
                    cb(null, pb.config.siteName);
                    return;
                }

                cb(null, obj.name + ' | ' + pb.config.siteName);
            });
        }
        else {
            cb(null, pb.config.siteName);
        }
    };

    Index.prototype.getNavigation = function(cb) {
        var options = {
            currUrl: this.req.url,
            site: this.site,
            session: this.session,
            ls: this.ls,
            activeTheme: this.activeTheme
        };

        var menuService = new pb.TopMenuService();
        menuService.getNavItems(options, function(err, navItems) {
            if (util.isError(err)) {
                pb.log.error('Index: %s', err.stack);
            }
            cb(navItems.themeSettings, navItems.navigation, navItems.accountButtons);
        });
    };

    //exports
    return Index;
};
