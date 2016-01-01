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
var url  = require('url');
var util = require('../../util.js');

module.exports = function UrlServiceModule(pb) {

    /**
     * A service that provides insight into the system's routes (URLs) along with
     * other utility functions to assist in examining and constructing URLs for
     * clients to use for interaction with the system.
     *
     * @class UrlService
     * @constructor
     * @module Services
     * @submodule Entities
     */
    function UrlService(site, onlyThisSite) {
        this.site = pb.SiteService.getCurrentSite(site);
        this.onlyThisSite = onlyThisSite;
        this.siteQueryService = new pb.SiteQueryService({site: this.site, onlyThisSite: this.onlyThisSite});
    }

    //dependencies
    var RequestHandler = pb.RequestHandler;

    /**
     * Takes the URL path and tests it against registered routes.
     * @static
     * @method exists
     * @param {string} url
     * @return  {object} The themed route specification for the first route that
     * matches the given URL path.  When no routes match NULL is returned.
     */
    UrlService.exists = function(url){

        var themes = null;
        for (var i = 0; i < RequestHandler.storage.length; i++) {
            var curr   = RequestHandler.storage[i];
            var result = curr.expression.test(url);
            if (result) {
                themes = util.clone(curr.themes);
                break;
            }
        }
        return themes;
    };

    /**
     * Look at a specific content type to see if a matching URL key exists.  An
     * optional ID can be provided to ensure that only an existing key for the
     * object with that ID exists.
     * @method existsForType
     * @param {object} params Contains the options for the function.  "url"
     * (string) and "type" (string) are required.  "id" (string) is optional.
     * @param {function} cb Callback function
     */
    UrlService.prototype.existsForType = function(params, cb) {
        var url  = params.url;
        var type = params.type;
        var id   = params.id;
        var site = params.site;

        //validate required params
        if (!url || !type) {
            cb(new Error("The url and type parameters are required. URL=["+url+"] TYPE=["+type+"]"), false);
            return;
        }

        //build pattern
        if (url.charAt(0) === '/') {
            url = url.substring(1);
        }
        if (url.charAt(url.length - 1) === '/') {
            url = url.substring(0, url.length - 1);
        }
        var pattern = "^\\/{0,1}" + util.escapeRegExp(url) + "\\/{0,1}$";

        //execute search
        var where = {
            url: new RegExp(pattern, 'g')
        };
        if (site !== undefined) {
            where[pb.SiteService.SITE_FIELD] = site;
        }
        this.siteQueryService.unique(type, where, id, function(err, isUnique) {
            cb(err, !isUnique);
        });
    };

    /**
     * Takes a variable set of arguments and joins them together to form a URL path.
     * @method urlJoin
     * @return {string} a URL path
     */
    UrlService.urlJoin = function() {
        var parts = [];
        for (var i = 0; i < arguments.length; i++) {
            var segment = ('' + arguments[i]).replace(/\\/g, '/');
            parts.push(segment.replace(/^\/|\/$/g, ''));
        }
        var url = parts.join('/');
        if (arguments.length > 0 && (arguments[0].charAt(0) === '/' || arguments[0].charAt(0) == '\\') && url.charAt(0) !== '/') {
            url = '/'+url;
        }
        return url;
    };

    /**
     * Takes a url and extracts the wild card part.
     * @method getCustomUrl
     * @param {string} prefix
     * @param {string} url
     * @return {string}The custom part of the URL
     */
    UrlService.getCustomUrl = function(prefix, url) {
        var index = prefix.lastIndexOf('/');
        if (index != prefix.length - 1) {
            prefix += '/';
        }

        index = url.lastIndexOf(prefix);
        if (index < 0) {
            return null;
        }

        //check for prefix at the end
        if (index == url.length - 1) {
            return '';
        }
        return url.substring(index + 1);
    };

    /**
     * Determines whether a URL is external to the system by parsing the URL and
     * then looking to see if the host matches that of the provided request.
     * @method isExternalUrl
     * @param {string} urlStr
     * @param {Request} request
     * @return {Boolean} TRUE if the link is external to the system, FALSE if not.
     */
    UrlService.isExternalUrl = function(urlStr, request) {
        var obj    = url.parse(urlStr);
        if(!obj.host) {
            return false;
        }

        var reqUrl = url.parse(request ? request.url : pb.config.siteRoot);
        return reqUrl.host !== obj.host;
    };

    /**
     * Indicates if the URL is fully qualified, meaning that the URL provides the
     * 'http' protocol at the beginning of the URL.
     * @method isFullyQualifiedUrl
     * @param {string} urlStr The URL to inspect
     * @return {Boolean} TRUE if fully qualified, FALSE if not
     */
    UrlService.isFullyQualifiedUrl = function(urlStr) {
        return util.isString(urlStr) && urlStr.indexOf('http') === 0;
    };

    /**
     * Creates a fully qualified URL to the system.
     * @static
     * @method createSystemUrl
     * @param {String} path
     * @param {Object} [options]
     * @param {String} [options.locale]
     * @param {String} [options.hostname]
     * @return {String}
     */
     UrlService.createSystemUrl = function(path, options) {
         if (!util.isObject(options)) {
             options = {};
         }

         var hostname = options.hostname;
         if (!hostname) {

             //we are in multi-site mode so just ensure we have a root so we
             //can at least stay on the same domain.  We can also safely assume
             //a standard site root.
             if (pb.config.multisite.enabled) {
                 hostname = '';
             }
             else {
                 var siteRootPath = url.parse(pb.config.siteRoot).path;
                 if (!path || path === '/') {
                     return siteRootPath;
                 }
                 hostname = pb.config.siteRoot;
             }
         }
         return options.locale ? UrlService.urlJoin(hostname, options.locale, path) :
            UrlService.urlJoin(hostname, path);
     };


    //exports
    return UrlService;
};
