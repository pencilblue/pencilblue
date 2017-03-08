/*
 Copyright (C) 2017  PencilBlue, LLC

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
const SiteUtils = require('../../utils/siteUtils');
const ValidationService = require('../../../include/validation/validation_service');

/**
 * A hash of the sites that are registered in this instance of PB.
 * @type {Object}
 */
const REGISTERED_SITES_BY_UID = {};

const REGISTERED_SITES_BY_HOSTNAME = {};

const REDIRECT_HOSTS = {};

/**
 * Manages the sites that are registered.  Although sites are registered they may not be active (accepting traffic).
 */
class ActiveSiteService {

    /**
     *
     * @param {object} siteSpec
     * @param {string} siteSpec.uid
     * @param {Boolean} siteSpec.active
     * @param {string} siteSpec.displayName
     * @param {hostname} siteSpec.hostname "host[:port]"
     * @param {string} siteSpec.defaultLocale
     * @param {Array} [siteSpec.supportedLocales],
     * @param {Array} [siteSpec.prevHostnames]
     * @return {Boolean}
     */
    static register (siteSpec) {
        if (REGISTERED_SITES_BY_UID[siteSpec.uid] || _.isNil(siteSpec.uid)) {
            return false;
        }

        //create index by hostname
        REGISTERED_SITES_BY_HOSTNAME[siteSpec.hostname] = {
            active: siteSpec.active,
            uid: siteSpec.uid,
            displayName: siteSpec.displayName,
            hostname: siteSpec.hostname,
            defaultLocale: siteSpec.defaultLocale,
            supportedLocales: siteSpec.supportedLocales || [],
            prevHostnames: siteSpec.prevHostnames || []
        };

        //create index by UID
        REGISTERED_SITES_BY_UID[siteSpec.uid] = siteSpec.hostname;

        //Populate redirect hosts index if this site has previous hostnames exist
        siteSpec.prevHostnames.forEach(function (oldHostname) {
            REDIRECT_HOSTS[oldHostname] = siteSpec.hostname;
        });

        return true;
    }

    static deregister (siteUid) {
        if (!REGISTERED_SITES_BY_UID[siteUid]) {
            return false;
        }

        //lookup hostname
        var hostname = REGISTERED_SITES_BY_UID[siteUid];
        var siteObj = REGISTERED_SITES_BY_HOSTNAME[hostname];

        //delete site out of indexes
        delete REGISTERED_SITES_BY_UID[siteUid];
        delete REGISTERED_SITES_BY_HOSTNAME[hostname];

        //remove any previous hostnames
        siteObj.prevHostNames.forEach(function(prevHostname) {
            delete REDIRECT_HOSTS[prevHostname];
        });

        return true;
    }

    static activate (siteUid) {
        return ActiveSiteService.setActive(siteUid, true);
    }

    static deactivate (siteUid) {
        return ActiveSiteService.setActive(siteUid, false);
    }

    static setActive (siteUid, active) {
        if (!REGISTERED_SITES_BY_UID[siteUid]) {
            return false;
        }

        var hostname = REGISTERED_SITES_BY_UID[siteUid];
        REGISTERED_SITES_BY_HOSTNAME[hostname].active = active;
        return true;
    }

    static getByHostname (hostname) {
        return _.clone(REGISTERED_SITES_BY_HOSTNAME[hostname]);
    }

    static getByUid (siteUid) {
        return ActiveSiteService.getByHostname(REGISTERED_SITES_BY_UID[siteUid]);
    }

    static getRedirectForHostname (hostname) {
        return REDIRECT_HOSTS[hostname];
    }
}

module.exports = ActiveSiteService;
