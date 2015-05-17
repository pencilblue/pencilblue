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
        if(options.isSection) {
            infiniteScrollScript += pb.ClientJs.getJSTag('var infiniteScrollSection = "' + section + '";');
        }
        else if(options.isTopic) {
            infiniteScrollScript += pb.ClientJs.getJSTag('var infiniteScrollTopic = "' + topic + '";');
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
                
                //***
                // TODO render comments
                //***
                
                return cb(null, '');
            }

            self.renderComments(content, ats, function(err, comments) {
                cb(err, new pb.TemplateValue(comments, false));
            });
        });
        ats.load('elements/article', cb);
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