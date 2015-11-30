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
var async       = require('async');
var url         = require('url');
var util        = require('../../util.js');
var HtmlEncoder = require('htmlencode');

module.exports = function(pb) {

    /**
     * @class SiteMapService
     * @constructor
     */
    function SiteMapService(context) {
        if (!util.isObject(context)) {
            throw new Error('context parameter must be a valid object');
        }

        this.ts = context.ts;

        this.ls = context.ls;

        this.articleService = context.articleService;

        this.pageService = context.pageService;

        this.dao = new pb.SiteQueryService({site: context.site, onlyThisSite: context.onlyThisSite});

        this.site = context.site;

        this.onlyThisSite = context.onlyThisSite;

        this.templatePath = context.templatePath || DEFAULT_TEMPLATE;

        this.urlTemplatePath = context.urlTemplatePath || DEFAULT_URL_TEMPLATE;
    }

    var DEFAULT_TEMPLATE = 'xml_feeds/sitemap';

    var DEFAULT_URL_TEMPLATE = 'xml_feeds/sitemap/url';

    var SITE_MAP_REGISTRY = {

        article: function(context, cb) {
            context.service.getForArticles(context, cb);
        },

        page: function(context, cb) {
            context.service.getForPages(context, cb);
        },

        section: function(context, cb) {
            context.service.getForSections(context, cb);
        }
    };

    SiteMapService.prototype.getAndSerialize = function(options, cb) {
        if (util.isFunction(options)) {
            cb = options;
            options = {};
        }
        var self = this;
        var tasks = [

            function(callback) {
                self.get(options, callback);
            },

            function(items, callback) {
                self.toXml(items, options, callback);
            }
        ];
        async.waterfall(tasks, cb);
    };

    SiteMapService.prototype.get = function(options, cb) {
        if (util.isFunction(options)) {
            cb = options;
            options = {};
        }

        var context = Object.freeze({
            service: this,
            site: this.site,
            onlyThisSite: this.onlyThisSite,
            ts: this.ts,
            hostname: this.hostname
        });
        var tasks = util.getTasks(Object.keys(SITE_MAP_REGISTRY), function(keys, i) {
            return function(callback) {
                SITE_MAP_REGISTRY[keys[i]](context, callback);
            };
        });
        async.parallel(tasks, SiteMapService.formatGetResults(cb));
    };

    SiteMapService.prototype.toXml = function(items, options, cb) {
        if (util.isFunction(options)) {
            cb = options;
            options = {};
        }

        var self = this;
        this.ts.registerModel({
            urls: function(flag, cb) {
                self._serializeItems(items, cb);
            }
        });
        this.ts.load(this.templatePath, cb);
    };

    SiteMapService.prototype._serializeItems = function(items, cb) {
        var self = this;

        var tasks = util.getTasks(items, function(items, i) {
            return function(callback) {
                var item = items[i];

                var ts = self.ts.getChildInstance();
                ts.registerModel({
                    change_freq: item.changeFrequency || 'daily',
                    priority: item.priority || '1.0',
                    url: item.url,
                    last_mod: SiteMapService.getLastModDate(item.last_modified),
                    alternate_links: new pb.TemplateValue(SiteMapService.createAlternateLinks(item, self.ls.language, pb.Localization.getSupported(), self.hostname), false)
                });
                ts.load(self.urlTemplatePath, callback);
            };
        });
        async.parallel(tasks, function(err, results) {
            if (util.isError(err)) {
                return cb(err);
            }
            cb(null, new pb.TemplateValue(results.join(''), false));
        })
    };

    SiteMapService.prototype.getForArticles = function(context, cb) {
        var opts = {
            service: this.articleService,
            weight: '1.0',
            localized: true,
            urlPrefix: '/article',
            hostname: this.hostname
        };
        this.getForContent(context, opts, cb);
    };

    SiteMapService.prototype.getForPages = function(context, cb) {
        var opts = {
            service: this.pageService,
            weight: '1.0',
            localized: true,
            urlPrefix: '/page',
            hostname: this.hostname
        };
        this.getForContent(context, opts, cb);
    };

    SiteMapService.prototype.getForContent = function(context, options, cb) {
        var opts = {
            select: { url: 1, last_modified: 1}
        };
        options.service.getPublished(opts, SiteMapService.onPostLoad(options, cb));
    };

    SiteMapService.prototype.getForSections = function(context, cb) {
        var opts = {
            select: { url: 1, last_modified: 1, type: 1, item: 1 },
            where: {type: {$ne: 'container'}}
        };
        this.dao.q('section', opts, SiteMapService.onPostLoad({urlPrefix: '', weight: '0.5', localized: true, hostname: this.hostname}, cb));
    };

    SiteMapService.onPostLoad = function(options, cb) {
        return function(err, results) {
            if (util.isError(err)) {
                return cb(err);
            }
            results.forEach(function(obj) {
                var url;
                if (options.urlPrefix === '') {//special case for navItems
                    pb.SectionService.formatUrl(obj);
                    url = obj.url;
                }
                else {
                    url = pb.UrlService.urlJoin(options.urlPrefix, obj.url);
                }
                obj.url = pb.UrlService.createSystemUrl(url, {hostname: options.hostname});
                obj.weight = options.weight;
                obj.localized = options.localized;
            });
            cb(null, results);
        };
    };

    SiteMapService.register = function(type, callback) {
        if (!util.isString(type)) {
            throw new Error('type parameter must be a string');
        }
        if (!util.isFunction(callback)) {
            throw new Error('callback parameter must be a function');
        }
        SITE_MAP_REGISTRY[type] = callback;
        return true;
    }

    SiteMapService.unregister = function(type) {
        if (!util.isString(type)) {
            throw new Error('type parameter must be a string');
        }
        SITE_MAP_REGISTRY[type] = callback;
        return true;
    };

    SiteMapService.getLastModDate = function(date) {
        var month = SiteMapService.paddedNumStr(date.getMonth() + 1);
        var day = SiteMapService.paddedNumStr(date.getDate());
        return date.getFullYear() + '-' + month + '-' + day;
    };

    SiteMapService.paddedNumStr = function(num) {
        return num < 10 ? '0' + num : '' + num;
    };

    SiteMapService.formatGetResults = function(cb) {
        return function(err, results) {
            if (util.isError(err)) {
                return cb(err);
            }

            var combined = results.reduce(function(prev, curr) {
                util.arrayPushAll(curr, prev);
                return prev;
            }, []);
            cb(null, combined);
        };
    };

    SiteMapService.createAlternateLinks = function(item, currentLocale, locales, hostname) {
        if (!item.localized) {
            return '';
        }

        return locales.reduce(function(prev, curr) {
            if (currentLocale === curr) {
                return prev;
            }

            var urlOpts = {
                hostname: hostname,
                locale: curr
            };
            var urlPath = url.parse(item.url).path;


            var context = {
                relationship: 'alternate',
                locale: curr,
                url: pb.UrlService.createSystemUrl(urlPath, urlOpts)
            };
            return prev + SiteMapService.serializeLocaleLink(context) + '\n';
        }, '');
    };

    SiteMapService.serializeLocaleLink = function(context) {
        return util.format('<xhtml:link rel="%s" hreflang="%s" href="%s" />', context.relationship, context.locale, HtmlEncoder.htmlEncode(context.url));
    };

    return SiteMapService;
};
