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
const Configuration = require('../../include/config');
const Localization = require('../../include/localization');
const url = require('url');

/**
 *
 */
class SiteUtils {

    /**
     * represents default configuration, not actually a full site
     * @readonly
     * @type {String}
     */
    static get GLOBAL_SITE() {
        return 'global';
    }

    /**
     *
     * @readonly
     * @type {String}
     */
    static get SITE_FIELD() {
        return 'site';
    }

    /**
     * Retrieves the global site context
     * @return {Object}
     */
    static getGlobalSiteContext () {
        var config = Configuration.active;

        var supportedLocales = Localization.getSupported().reduce(function (map, supportedLocale) {
            map[supportedLocale] = true;
            return map;
        }, {});

        return {
            displayName: config.siteName,
            uid: SiteUtils.GLOBAL_SITE,
            hostname: config.multisite.enabled ? url.parse(config.multisite.globalRoot).host : url.parse(config.siteRoot).host,
            active: !config.multisite.enabled,
            defaultLocale: Localization.getDefaultLocale(),
            supportedLocales: supportedLocales,
            prevHostnames: []
        };
    }

    /**
     * Determine whether http or https is being used for the site and return hostname attached to http(s)
     * @param {String} hostname
     * @return {String} hostname with protocol attached
     */
    static getHostWithProtocol (hostname) {
        hostname = hostname.match(/^http/g) ? hostname : '//' + hostname;
        var urlObject = url.parse(hostname, false, true);
        urlObject.protocol = Configuration.active.server.ssl.enabled ? 'https' : 'http';
        return url.format(urlObject).replace(/\/$/, '');
    }

    /**
     * Returns true if siteId given is global or non-existent (to remain backwards compatible)
     * @param {String} siteId - the site id to check
     * @return {Boolean} true if global or does not exist
     */
    static isGlobal(siteId) {
        return (!siteId || siteId === SiteUtils.GLOBAL_SITE);
    }

    /**
     * Returns true if actual is not set (falsey) or logically equivalent to expected in terms of sites
     * @param {String} actual - site to check
     * @param {String} expected - site you expect to be equal
     * @return {Boolean} true if actual exists and equals expected
     */
    static isNotSetOrEqual(actual, expected) {
        return !actual || SiteService.areEqual(actual, expected);
    }

    /**
     * Returns true if both site ids given are equal
     * @param {String} siteA - first site id to compare
     * @param {String} siteB - second site id to compare
     * @return {Boolean} true if equal, false otherwise
     */
    static areEqual(siteA, siteB) {
        if (SiteUtils.isGlobal(siteA) && SiteUtils.isGlobal(siteB)) {
            return true;
        }
        return siteA === siteB;
    }
}

module.exports = SiteUtils;
