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
const SiteUtils = require('../../utils/siteUtils');
const ValidationService = require('../../../include/validation/validation_service');

/**
 * A hash of the plugins that are installed and active in this instance of PB.
 * @type {Object}
 */
const ACTIVE_PLUGINS = {};

/**
 * Provides a cache and convenience functions for plugins that are active for the given instance
 */
class ActivePluginService {

    /**
     * Activates a plugin based on the UID and the provided spec
     * @param {string} pluginUid
     * @param {object} pluginSpec
     * @param {function} pluginSpec.main_module
     * @param {string} pluginSpec.public_dir
     * @param {object} pluginSpec.permissions
     * @param {Array} pluginSpec.templates
     * @param {string} pluginSpec.icon
     * @param {object} pluginSpec.services
     * @param {string} site
     * @returns {boolean} TRUE if the site is set as active and FALSE when the site is already active
     */
    static activate(pluginUid, pluginSpec, site) {
        if (ACTIVE_PLUGINS[site] && ACTIVE_PLUGINS[site][pluginUid]) {
            return false;
        }
        if (!ACTIVE_PLUGINS[site]) {
            ACTIVE_PLUGINS[site] = {};
        }
        ACTIVE_PLUGINS[site][pluginUid] = pluginSpec;
        return true;
    }

    /**
     * Remove the active plugin entry from the current PB process.
     * NOTE: it is not recommended to call this directly.
     * @param {String} pluginUid
     * @param {string} site
     * @return {Boolean}
     */
    static deactivate(pluginUid, site) {
        if (!ValidationService.isNonEmptyStr(pluginUid)) {
            throw new Error('A non-existent or empty plugin UID was passed');
        }

        if (ACTIVE_PLUGINS[site] && ACTIVE_PLUGINS[site][pluginUid]) {
            delete ACTIVE_PLUGINS[site][pluginUid];
            return true;
        }
        return false;
    }

    /**
     * Retrieves the main module prototype for the specified active plugin
     * @param {String} pluginUid
     * @param {string} site
     * @return {Function} The prototype that is the plugin's main module.
     */
    static getMainModule(pluginUid, site) {
        return (ACTIVE_PLUGINS[site] && ACTIVE_PLUGINS[site][pluginUid]) ? ACTIVE_PLUGINS[site][pluginUid].main_module : null;
    }

    /**
     * Retrieves the names of the active plugins for this instance
     * @return {Array} An array that contain the names of the plugins that
     * initialized successfully within this instance.
     */
    static getPluginNames() {
        var globalPlugins = [];
        if (ACTIVE_PLUGINS[SiteUtils.GLOBAL_SITE]) {
            globalPlugins = Object.keys(ACTIVE_PLUGINS[SiteUtils.GLOBAL_SITE]);
        }
        var sitePlugins = [];
        if (ACTIVE_PLUGINS[this.site]) {
            sitePlugins = Object.keys(ACTIVE_PLUGINS[this.site]);
        }
        return _.uniq(sitePlugins.concat(globalPlugins));
    }

    /**
     * TODO: Figure out if this is needed or the data structure needs to be changed
     * Get a array of active plugin names with site name as a prefix: site_name_plugin_name
     * @return {Array} array of active plugin names with site name prefix.
     */
    static getAllPluginNames () {
        var pluginNames = [];
        var siteNames = Object.keys(ACTIVE_PLUGINS);
        for (var i = 0; i < siteNames.length; i++) {
            var sitePluginNames = Object.keys(ACTIVE_PLUGINS[siteNames[i]]);
            for (var j = 0; j < sitePluginNames.length; j++) {
                pluginNames.push(siteNames[i] + '_' + sitePluginNames[j]);
            }
        }
        return pluginNames;
    }

    /**
     * Retrieves the permission set for a given role.  All active plugins are
     * inspected.
     * @param {string} role The role to get permissions for
     * @return {Object} A hash of the permissions
     */
    static getPermissionsForRole(role) {
        var perms = {};
        Object.keys(ACTIVE_PLUGINS).forEach(function (site) {
            Object.keys(ACTIVE_PLUGINS[site]).forEach(function (pluginUid) {
                var permissions = ACTIVE_PLUGINS[site][pluginUid].permissions;
                if (permissions) {

                    var permsAtLevel = permissions[role];
                    if (permsAtLevel) {
                        Object.assign(perms, permsAtLevel);
                    }
                }
            });
        });

        return perms;
    }

    /**
     * TODO [1.0] why is this needed?  can we move it to plugin utils and construct the path? Use case seems to be for public resource serving.  Maybe check to make sure the plugin is active before hand?
     * Retrieves the file path to the public directory for the specified plugin.
     * @static
     * @method getActivePluginDir
     * @param {String} pluginUid A plugin's UID value
     * @return {String} File path to the plugin's public directory
     */
    static getPublicDir(pluginUid) {
        var publicPath = null;
        var keys = Object.keys(ACTIVE_PLUGINS);
        for (var i = 0; i < keys.length; i++) {
            if (ACTIVE_PLUGINS[keys[i]][pluginUid]) {
                publicPath = ACTIVE_PLUGINS[keys[i]][pluginUid].public_dir;
                break;
            }
        }
        return publicPath;
    }

    /**
     *
     * @param {string} pluginUid
     * @param site
     * @returns {object}
     */
    static get(pluginUid, site) {
        if (ACTIVE_PLUGINS[site] && ACTIVE_PLUGINS[site][pluginUid]) {
            return ACTIVE_PLUGINS[site][pluginUid];
        } else if (ACTIVE_PLUGINS[SiteUtils.GLOBAL_SITE] && ACTIVE_PLUGINS[SiteUtils.GLOBAL_SITE][pluginUid]) {
            return ACTIVE_PLUGINS[SiteUtils.GLOBAL_SITE][pluginUid];
        }
        return null;
    }

    /**
     * Indicates if the specified plugin is active in this instance of PB.
     * @param {String} uid The unique identifier for a plugin
     * @param {string} [site=global]
     * @return {Boolean} TRUE if the plugin is active, FALSE if not
     */
    static isActive(uid, site) {
        site = site || SiteUtils.GLOBAL_SITE;
        return !!ActivePluginService.get(uid, site);
    }

    /**
     * TODO [1.0] can the other isActive be consolidated?
     * Indicates if the specified plugin is active for a given site in this instance of PB.
     * @static
     * @method isActivePlugin
     * @param {String} uid The unique identifier for a plugin
     * @param {string} site
     * @return {Boolean} TRUE if the plugin is active, FALSE if not
     */
    static isActiveForSite(uid, site) {
        if (!site) {
            site = SiteUtils.GLOBAL_SITE;
        }
        return ACTIVE_PLUGINS[site] && ACTIVE_PLUGINS[site][uid];
    }

    /**
     * Retrieves the content templates for all of the active plugins
     * @param {string} targetSite
     * @return {Array} An array of objects
     */
    static getContentTemplates(targetSite) {

        var templates = [];
        Object.keys(ACTIVE_PLUGINS).forEach(function (site) {
            if (!SiteUtils.isNotSetOrEqual(targetSite, site)) {
                return;
            }
            var pluginsForSite = ACTIVE_PLUGINS[site];
            Object.keys(pluginsForSite).forEach(function (uid) {
                var plugin = pluginsForSite[uid];
                if (plugin.templates) {
                    var clone = _.clone(plugin.templates);
                    for (var i = 0; i < clone.length; i++) {
                        clone[i].theme_uid = uid;
                        templates.push(clone[i]);
                    }
                }
            });
        });
        return templates;
    }

    /**
     * Retrieves a plugin service prototype.  It is expected to be a prototype but
     * it may also be an instance as along as that instance fulfills all
     * responsibilities of the service interface.  When the desired service does not
     * exist NULL is returned.
     * @param {String} serviceName
     * @param {String} pluginUid The unique plugin identifier
     * @param {string} [site=global] - The site UID
     * @return {Object} Service prototype
     */
    static getService(serviceName, pluginUid, site) {
        if (!site) {
            site = SiteUtils.GLOBAL_SITE;
        }
        if (ACTIVE_PLUGINS[site] && ACTIVE_PLUGINS[site][pluginUid]) {
            if (ACTIVE_PLUGINS[site][pluginUid].services && ACTIVE_PLUGINS[site][pluginUid].services[serviceName]) {
                return ACTIVE_PLUGINS[site][pluginUid].services[serviceName];
            }
        } else if (ACTIVE_PLUGINS[SiteUtils.GLOBAL_SITE] && ACTIVE_PLUGINS[SiteUtils.GLOBAL_SITE][pluginUid]) {
            if (ACTIVE_PLUGINS[SiteUtils.GLOBAL_SITE][pluginUid].services && ACTIVE_PLUGINS[SiteUtils.GLOBAL_SITE][pluginUid].services[serviceName]) {
                return ACTIVE_PLUGINS[SiteUtils.GLOBAL_SITE][pluginUid].services[serviceName];
            }
        }
        throw new Error('Either plugin [' + pluginUid + '] or the service [' + serviceName + '] does not exist for site [' + site + ']');
    }
}



module.exports = ActivePluginService;
