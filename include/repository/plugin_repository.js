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
const async = require('async');
const DAO = require('../dao/dao');
const SiteUtils = require('../../lib/utils/siteUtils');

/**
 * Empty constructor because this object uses static methods.
 * @class PluginRepository
 * @constructor
 */
class PluginRepository {

    /**
     * @readonly
     * @type {string}
     */
    static get PLUGIN_COLL() {
        return 'plugin';
    }

    /**
     * Retrieves the plugins that have themes associated with them from both site and global level.
     * @method loadPluginsWithThemesAvailableToThisSite
     * @static
     * @param {String} site - site unique id
     * @param {Function} cb - the callback function
     */
    static loadPluginsWithThemesAvailableToThisSite(site, cb) {
        var dao = new DAO();
        var hasATheme = getHasThemeQuery();
        var belongsToSite = getBelongsToSiteQuery(site);
        var belongsToGlobal = getBelongsToSiteQuery(SiteUtils.GLOBAL_SITE);
        var siteWhere = {
            $and: [hasATheme, belongsToSite]
        };
        var globalWhere = {
            $and: [hasATheme, belongsToGlobal]
        };
        var tasks = {
            sitePlugins: function (callback) {
                dao.q(PluginRepository.PLUGIN_COLL, {where: siteWhere}, callback);
            },
            globalPlugins: function (callback) {
                dao.q(PluginRepository.PLUGIN_COLL, {where: globalWhere}, callback);
            }
        };
        async.parallel(tasks, function (err, results) {
            if (err) {
                cb(err, null);
            } else {
                var sitePlugins = results.sitePlugins || [];
                var globalPlugins = results.globalPlugins || [];
                var resultArray = mergeSitePluginsWithGlobalPlugins(sitePlugins, globalPlugins);
                cb(null, resultArray);
            }
        });
    }

    /**
     * Retrieves the plugins that have themes associated with them from site level.
     * @method loadPluginsWithThemesOwnedByThisSite
     * @static
     * @param {String} site - site unique id
     * @param {Function} cb - the callback function
     */
    static loadPluginsWithThemesOwnedByThisSite(site, cb) {
        var dao = new DAO();
        var hasATheme = getHasThemeQuery();
        var belongsToSite = getBelongsToSiteQuery(site);
        var where = {
            $and: [hasATheme, belongsToSite]
        };
        dao.q(PluginRepository.PLUGIN_COLL, {where: where}, cb);
    }

    /**
     * Loads the plugin object on the site level from the database.
     * @method loadPluginOwnedByThisSite
     * @static
     * @param {String} pluginID - plugin unique id
     * @param {String} site - site unique id
     * @param {Function} cb - the callback function
     */
    static loadPluginOwnedByThisSite(pluginID, site, cb) {
        var hasCorrectIdentifier = getCorrectIdQuery(pluginID);
        var belongsToThisSite = getBelongsToSiteQuery(site);

        var where = {
            $and: [hasCorrectIdentifier, belongsToThisSite]
        };

        var dao = new DAO();
        dao.loadByValues(where, PluginRepository.PLUGIN_COLL, cb);
    }

    /**
     * Loads the plugin object on the site level first. If blank, attempts to load plugin object from the global level.
     * @method loadPluginAvailableToThisSite
     * @static
     * @param {String} pluginID - plugin unique id
     * @param {String} site - site unqiue id
     * @param {Function} cb - the callback function
     */
    static loadPluginAvailableToThisSite(pluginID, site, cb) {
        PluginRepository.loadPluginOwnedByThisSite(pluginID, site, function (err, plugin) {
            if (_.isError(err)) {
                cb(err, null);
                return;
            }

            if (!plugin) {
                if (site && site !== SiteUtils.GLOBAL_SITE) {
                    PluginRepository.loadPluginOwnedByThisSite(pluginID, SiteUtils.GLOBAL_SITE, cb);
                    return;
                }
                cb(err, null);
            }

            cb(err, plugin);
        });
    }

    /**
     * Load all plugin objects included in pluginIDs on a site level.
     * @method loadIncludedPluginsOwnedByThisSite
     * @static
     * @param {Array} pluginIDs - array of plugin unique ids
     * @param {String} site - site unique id
     * @param {Function} cb - callback function
     */
    static loadIncludedPluginsOwnedByThisSite(pluginIDs, site, cb) {
        if (!pluginIDs || !pluginIDs.length) {
            pluginIDs = [];
        }
        var idIsInTheList = getIdsInListQuery(pluginIDs);
        var belongsToThisSite = getBelongsToSiteQuery(site);
        var where = {
            $and: [idIsInTheList, belongsToThisSite]
        };
        var opts = {
            select: DAO.PROJECT_ALL,
            where: where,
            order: [['created', DAO.ASC]]
        };
        var dao = new DAO();
        dao.q(PluginRepository.PLUGIN_COLL, opts, cb);
    }

    /**
     * Loads plugin objects of plugin IDs that are not include in pluginIDs on the site level.
     * @method loadPluginsNotIncludedOwnedByThisSite
     * @static
     * @param {Array} pluginIDs - array of plugin unique ids to exclude
     * @param {String} site - site unique id
     * @param {Function} cb - callback function
     */
    static loadPluginsNotIncludedOwnedByThisSite(pluginIDs, site, cb) {
        if (!pluginIDs || !pluginIDs.length) {
            pluginIDs = [];
        }
        var idIsNotInTheList = getIdsNotInListQuery(pluginIDs);
        var belongsToThisSite = getBelongsToSiteQuery(site);
        var where = {
            $and: [idIsNotInTheList, belongsToThisSite]
        };
        var opts = {
            select: DAO.PROJECT_ALL,
            where: where,
            order: [['created', DAO.ASC]]
        };
        var dao = new DAO();
        dao.q(PluginRepository.PLUGIN_COLL, opts, cb);
    }

    /**
     * Load the entire plugin collection on both site and global levels.
     * @method loadPluginsAcrossAllSites
     * @static
     * @param {Function} cb - the callback function
     */
    static loadPluginsAcrossAllSites(cb) {
        var dao = new DAO();
        dao.q(PluginRepository.PLUGIN_COLL, cb);
    }
}

function getIdsNotInListQuery(pluginIDs) {
    return {uid: {'$nin': pluginIDs}};
}

function getIdsInListQuery(pluginIDs) {
    return {uid: {'$in': pluginIDs}};
}

function getHasThemeQuery() {
    return {theme: {$exists: true}};
}

function getCorrectIdQuery(pluginID) {
    var hasCorrectIdentifier = {
        $or: [
            {},
            {
                uid: pluginID
            }
        ]
    };
    hasCorrectIdentifier.$or[0][DAO.getIdField()] = pluginID;
    return hasCorrectIdentifier;
}

function getBelongsToSiteQuery(site) {
    var belongsToThisSite = {};
    if (!site || site === SiteUtils.GLOBAL_SITE) {
        var hasNoSite = {};
        hasNoSite[SiteUtils.SITE_FIELD] = {$exists: false};

        var siteIsGlobal = {};
        siteIsGlobal[SiteUtils.SITE_FIELD] = SiteUtils.GLOBAL_SITE;

        belongsToThisSite = {
            $or: [
                hasNoSite,
                siteIsGlobal
            ]
        };
    } else {
        belongsToThisSite = {};
        belongsToThisSite[SiteUtils.SITE_FIELD] = site;
    }
    return belongsToThisSite;
}

function mergeSitePluginsWithGlobalPlugins(sitePlugins, globalPlugins) {
    var resultArray = [].concat(sitePlugins);

    for (var j = 0; j < globalPlugins.length; j++) {
        var exists = false;
        for (var i = 0; i < sitePlugins.length; i++) {
            if (pluginsHaveSameID(globalPlugins[j], sitePlugins[i])) {
                exists = true;
            }
        }
        if (!exists) {
            resultArray.push(globalPlugins[j]);
        }
    }
    return resultArray;
}

function pluginsHaveSameID(pluginOne, pluginTwo) {
    var otherIDField = DAO.getIdField();
    if (pluginOne.uid && pluginTwo.uid) {
        if (pluginOne.uid === pluginTwo.uid) {
            return true;
        }
    }
    if (pluginOne[otherIDField] && pluginTwo[otherIDField]) {
        if (pluginOne[otherIDField] === pluginTwo[otherIDField]) {
            return true;
        }
    }
    return false;
}

module.exports = PluginRepository;
