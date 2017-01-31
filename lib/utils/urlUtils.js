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
var url = require('url');
var Configuration = require('../../include/config');

class UrlUtils {

    static urlJoin () {
        return UrlUtils.join.apply(this, arguments);
    }
    /**
     * Takes a variable set of arguments and joins them together to form a URL path.
     * @return {string} a URL path
     */
    static join () {
        var parts = [];
        for (var i = 0; i < arguments.length; i++) {
            var segment = ('' + arguments[i]).replace(/\\/g, '/');
            parts.push(segment.replace(/^\/|\/$/g, ''));
        }
        var url = parts.join('/');
        if (arguments.length > 0 && (arguments[0].charAt(0) === '/' || arguments[0].charAt(0) === '\\') && url.charAt(0) !== '/') {
            url = '/'+url;
        }
        return url;
    }

    /**
     * Takes a url and extracts the wild card part.
     * @param {string} prefix
     * @param {string} url
     * @return {string}The custom part of the URL
     */
    static getCustomUrl (prefix, url) {
        var index = prefix.lastIndexOf('/');
        if (index !== prefix.length - 1) {
            prefix += '/';
        }

        index = url.lastIndexOf(prefix);
        if (index < 0) {
            return null;
        }

        //check for prefix at the end
        if (index === url.length - 1) {
            return '';
        }
        return url.substring(index + 1);
    }

    /**
     * Determines whether a URL is external to the system by parsing the URL and
     * then looking to see if the host matches that of the provided request.
     * @param {string} urlStr
     * @param {Request} request
     * @return {Boolean} TRUE if the link is external to the system, FALSE if not.
     */
    static isExternalUrl (urlStr, request) {
        var obj    = url.parse(urlStr);
        if(!obj.host) {
            return false;
        }

        var reqUrl = url.parse(request ? request.url : Configuration.active.siteRoot);
        return reqUrl.host !== obj.host;
    }

    /**
     * Indicates if the URL is fully qualified, meaning that the URL provides the
     * 'http' protocol at the beginning of the URL.
     * @param {string} urlStr The URL to inspect
     * @return {Boolean} TRUE if fully qualified, FALSE if not
     */
    static isFullyQualifiedUrl (urlStr) {
        return typeof urlStr === 'string' && urlStr.indexOf('http') === 0;
    }

    /**
     * Creates a fully qualified URL to the system.
     * @param {String} path
     * @param {Object} [options]
     * @param {String} [options.locale]
     * @param {String} [options.hostname]
     * @return {String}
     */
    static createSystemUrl (path, options) {
        if (typeof options !== 'object') {
            options = {};
        }

        var hostname = options.hostname;
        if (!hostname) {

            //we are in multi-site mode so just ensure we have a root so we
            //can at least stay on the same domain.  We can also safely assume
            //a standard site root.
            var config = Configuration.active;
            if (config.multisite.enabled) {
                hostname = '';
            }
            else {
                var siteRootPath = url.parse(config.siteRoot).path;
                if (!path || path === '/') {
                    return siteRootPath;
                }
                hostname = config.siteRoot;
            }
        }
        return options.locale ? UrlUtils.urlJoin(hostname, options.locale, path) :
            UrlUtils.urlJoin(hostname, path);
    }
}

module.exports = UrlUtils;
