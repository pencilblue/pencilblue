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
var async       = require('async');
var url         = require('url');
var util        = require('../../util.js');
var HtmlEncoder = require('htmlencode');

module.exports = function(pb) {

    /**
     * @class SiteMapService
     * @constructor
     * @param {Object} context
     * @param {TemplateService} context.ts
     * @param {Localization} context.ls
     * @param {ArticleServiceV2} context.articleService
     * @param {PageService} context.pageService
     * @param {String} context.site The site UID
     * @param {Boolean} context.onlyThisSite
     * @param {String} context.templatePath
     * @param {String} context.urlTemplatePath
     * @param {Array} [context.supportedLocales]
     */
    function SiteMapService(context) {
        if (!util.isObject(context)) {
            throw new Error('context parameter must be a valid object');
        }

        /**
         * @property ts
         * @type {TemplateService}
         */
        this.ts = context.ts;

        /**
         * @property ls
         * @type {Localization}
         */
        this.ls = context.ls;

        /**
         * @property articleService
         * @type {ArticleServiceV2}
         */
        this.articleService = context.articleService;

        /**
         * @property pageService
         * @type {PageService}
         */
        this.pageService = context.pageService;

        /**
         * @property dao
         * @type {SiteQueryService}
         */
        this.dao = new pb.SiteQueryService({site: context.site, onlyThisSite: context.onlyThisSite});

        /**
         * @property site
         * @type {String}
         */
        this.site = context.site;

        /**
         * @property onlyThisSite
         * @type {Boolean}
         */
        this.onlyThisSite = context.onlyThisSite;

        /**
         * @property templatePath
         * @type {String}
         */
        this.templatePath = context.templatePath || DEFAULT_TEMPLATE;

        /**
         * @property urlTemplatePath
         * @type {String}
         */
        this.urlTemplatePath = context.urlTemplatePath || DEFAULT_URL_TEMPLATE;

        /**
         * The locales that are supported for the site as an array of strings
         * @property supportedLocales
         * @type {Array}
         */
        this.supportedLocales = context.supportedLocales || pb.Localization.getSupported();

        /**
         * The instance of the registry to pull from.  Initializes based off of the global configuration
         * @property siteMapRegistry
         * @type {Object}
         */
        this.siteMapRegistry = util.merge(SITE_MAP_REGISTRY, {});
    }

    /**
     *
     * @private
     * @static
     * @property DEFAULT_TEMPLATE
     * @type {String}
     */
    var DEFAULT_TEMPLATE = 'xml_feeds/sitemap';

    /**
     *
     * @private
     * @static
     * @property DEFAULT_URL_TEMPLATE
     * @type {String}
     */
    var DEFAULT_URL_TEMPLATE = 'xml_feeds/sitemap/url';

    /**
     *
     * @private
     * @static
     * @property SITE_MAP_REGISTRY
     * @type {Object}
     */
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

    /**
     *
     * @method getAndSerialize
     * @param {Object} [options]
     * @param {Function} cb
     */
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

    /**
     *
     * @method get
     * @param {Object} [options]
     * @param {Function} cb
     */
    SiteMapService.prototype.get = function(options, cb) {
        if (util.isFunction(options)) {
            cb = options;
            options = {};
        }

        var self = this;
        var context = Object.freeze({
            service: this,
            site: this.site,
            onlyThisSite: this.onlyThisSite,
            ts: this.ts,
            hostname: this.hostname
        });
        var tasks = util.getTasks(Object.keys(self.siteMapRegistry), function(keys, i) {
            return function(callback) {
                self.siteMapRegistry[keys[i]](context, callback);
            };
        });
        async.parallel(tasks, SiteMapService.formatGetResults(cb));
    };

    /**
     *
     * @method toXml
     * @param {Array} items
     * @param {Object} [options]
     * @param {Function} cb
     */
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

    /**
     *
     * @private
     * @method _serializeItems
     * @param {Array} items
     * @param {Function} cb
     */
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
                    last_mod: SiteMapService.getLastModDateStr(item.last_modified),
                    alternate_links: new pb.TemplateValue(SiteMapService.createAlternateLinks(item, self.ls.language, self.supportedLocales, self.hostname), false)
                });
                ts.load(self.urlTemplatePath, callback);
            };
        });
        async.parallel(tasks, function(err, results) {
            if (util.isError(err)) {
                return cb(err);
            }
            cb(null, new pb.TemplateValue(results.join(''), false));
        });
    };

    /**
     *
     * @method getForArticles
     * @param {Object} context
     * @param {Function} cb
     */
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

    /**
     *
     * @method getForPages
     * @param {Object} context
     * @param {Function} cb
     */
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

    /**
     *
     * @method getForContent
     * @param {Object} context
     * @param {Object} options
     * @param {Function} cb
     */
    SiteMapService.prototype.getForContent = function(context, options, cb) {
        var opts = {
            select: { url: 1, last_modified: 1}
        };
        options.service.getPublished(opts, SiteMapService.onPostLoad(options, cb));
    };

    /**
     *
     * @method getForSections
     * @param {Object} context
     * @param {Function} cb
     */
    SiteMapService.prototype.getForSections = function(context, cb) {
        var opts = {
            select: { url: 1, last_modified: 1, type: 1, item: 1 },
            where: {type: {$ne: 'container'}}
        };
        this.dao.q('section', opts, SiteMapService.onPostLoad({urlPrefix: '', weight: '0.5', localized: true, hostname: this.hostname}, cb));
    };

    /**
     * Returns a function that processes site map items.  It calculates the
     * full URL for the item as well as setting the weight and indicating if
     * the items is localized.  The returned function accepts two parameters.
     * The first is an error object, if exists.  The second is an Array of
     * objects.
     * @static
     * @method onPostLoad
     * @param {Object} options
     * @param {String} options.urlPrefix
     * @param {Decimal} options.weight
     * @param {Boolean} options.localized
     * @param {Function} cb
     * @return {Function}
     */
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

    /**
     * Registers an item provider.  The callback should take two parameters.
     * The first is a context object. The second is callback function.
     * @static
     * @method register
     * @param {String} type
     * @param {Function} callback
     * @return {Boolean}
     */
    SiteMapService.register = function(type, callback) {
        if (!pb.ValidationService.isNonEmptyStr(type, true)) {
            throw new Error('type parameter must be a string');
        }
        if (!util.isFunction(callback)) {
            throw new Error('callback parameter must be a function');
        }
        SITE_MAP_REGISTRY[type] = callback;
        return true;
    };

    /**
     * Unregisters an item provider from the site map service
     * @static
     * @method unregister
     * @param {String} type
     * @return {Boolean}
     */
    SiteMapService.unregister = function(type) {
        if (!pb.ValidationService.isNonEmptyStr(type, true)) {
            throw new Error('type parameter must be a string');
        }

        var exists = util.isFunction(SITE_MAP_REGISTRY[type]);
        if (exists) {
            delete SITE_MAP_REGISTRY[type];
        }
        return exists;
    };

    /**
     * Formats date objects to a string in the format of: YYYY-MM-DD
     * @static
     * @method getLastModDateStr
     * @param {Date} date
     * @return {String}
     */
    SiteMapService.getLastModDateStr = function(date) {
        var month = SiteMapService.paddedNumStr(date.getMonth() + 1);
        var day = SiteMapService.paddedNumStr(date.getDate());
        return date.getFullYear() + '-' + month + '-' + day;
    };

    /**
     * Converts the provided number to a string. If the number is less than 10
     * it is prefix with a '0'.
     * @static
     * @method paddedNumStr
     * @param {Integer} num
     * @return {String}
     */
    SiteMapService.paddedNumStr = function(num) {
        return num < 10 ? '0' + num : '' + num;
    };

    /**
     * Returns a function that accepts two parameters. The first is an error,
     * if exists, and the second is an array of arrays. The returning function,
     * when executed, reduces the array of arrays down to a single array.
     * NOTE: results are not deduped.
     * @static
     * @method formatGetResults
     * @param {Function} cb
     * @return {Function}
     */
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

    /**
     * Takes a site map item and inspects its localized property.  If it
     * evaluates to TRUE then the XML elements are generated that match the
     * allowed locales
     * @static
     * @method createAlternateLinks
     * @param {Object} item
     * @param {String} currentLocale
     * @param {Array} locales
     * @param {String} hostname
     * @return {String}
     */
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

    /**
     * Takes the provided relationship, locale, and URL to generate an XML
     * element to represent the alternate link for a site map
     * @static
     * @method serializeLocaleLink
     * @param {Object} context
     * @param {String} context.relationship
     * @param {String} context.locale
     * @param {String} context.url
     * @return {String}
     */
    SiteMapService.serializeLocaleLink = function(context) {
        return util.format('<xhtml:link rel="%s" hreflang="%s" href="%s" />', context.relationship, context.locale, HtmlEncoder.htmlEncode(context.url));
    };

    return SiteMapService;
};
