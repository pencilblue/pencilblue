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
const ActiveSiteService = require('../../../lib/service/sites/activeSiteService');
const async = require('async');
const BaseObjectService = require('../base_object_service');
const CommandService = require('../../system/command/command_service');
const Configuration = require('../../config');
const DAO = require('../../dao/dao');
const Localization = require('../../localization');
const log = require('../../utils/logging').newInstance('SiteService');
const RegExpUtils = require('../../utils/reg_exp_utils');
const RequestHandler = require('../../http/request_handler');
const SiteActivateJob = require('../jobs/sites/site_activate_job');
const SiteCreateEditJob = require('../jobs/sites/site_create_edit_job');
const SiteDeactivateJob = require('../jobs/sites/site_deactivate_job');
const SiteQueryService = require('./site_query_service');
const SiteUtils = require('../../../lib/utils/siteUtils');
const url = require('url');
const util = require('util');
const uuid = require('uuid');

/**
 * Service for performing site specific operations.
 * @param {object} context
 */
class SiteService extends BaseObjectService {
    constructor(context) {

        //the site service is never concerned with site specifics so we can default the options.
        if (!_.isObject(context)) {
            context = {};
        }
        context.site = SiteUtils.GLOBAL_SITE;
        context.onlyThisSite = false;
        context.type = SiteService.TYPE;

        //call parent constructor
        super(context);

        //override DAO with non-site specific DAO
        this.dao = new DAO();
    }

    /**
     * The name of the DB collection where the resources are persisted
     * @readonly
     * @type {String}
     */
    static get TYPE() {
        return 'site';
    }

    /**
     * represents a site that doesn't exist
     * @static
     * @readonly
     * @property NO_SITE
     * @type {String}
     */
    static get NO_SITE() {
        return 'no-site';
    }

    /**
     *
     * @static
     * @readonly
     * @property SITE_COLLECTION
     * @type {String}
     */
    static get SITE_COLLECTION() {
        return 'site';
    }

    /**
     * Load full site config from the database using the unique id.
     * @method getByUid
     * @param {String} uid - unique id of site
     * @param {Function} cb - the callback function
     */
    getByUid(uid, cb) {
        if (!uid || uid === SiteUtils.GLOBAL_SITE) {
            cb(null, {
                displayName: Configuration.active.siteName,
                hostname: Configuration.active.siteRoot,
                uid: SiteUtils.GLOBAL_SITE,
                defaultLocale: Localization.getDefaultLocale(),
                supportedLocales: {}
            });
        }
        else {
            var dao = new DAO();
            var where = {uid: uid};
            dao.loadByValues(where, SiteService.SITE_COLLECTION, cb);
        }
    }

    /**
     * Get all of the site objects in the database
     * @method getAllSites
     * @param {Function} cb - the callback function
     */
    getAllSites(cb) {
        var dao = new DAO();
        dao.q(SiteService.SITE_COLLECTION, {select: DAO.PROJECT_ALL, where: {}}, cb);
    }

    /**
     * Get all site objects where activated is true.
     * @method getActiveSites
     * @param {Function} cb - the callback function
     */
    getActiveSites(cb) {
        var dao = new DAO();
        dao.q(SiteService.SITE_COLLECTION, {select: DAO.PROJECT_ALL, where: {active: true}}, cb);
    }

    /**
     * Get all site objects where activated is false.
     * @method getInactiveSites
     * @param {Function} cb - the callback function
     */
    getInactiveSites(cb) {
        var dao = new DAO();
        dao.q(SiteService.SITE_COLLECTION, {where: {active: false}}, cb);
    }

    /**
     * Get all site objects segmented by active status.
     * @method getSiteMap
     * @param {Function} cb - the callback function
     */
    getSiteMap(cb) {
        var self = this;
        var tasks = {
            active: function (callback) {
                self.getActiveSites(callback);
            },

            inactive: function (callback) {
                self.getInactiveSites(callback);
            }
        };
        async.series(tasks, cb);
    }

    /**
     * Get site name given a unique id.
     * @method getSiteNameByUid
     * @param {String} uid - unique id
     * @param {Function} cb - the callback function
     */
    getSiteNameByUid(uid, cb) {
        var dao = new DAO();
        dao.q(SiteService.SITE_COLLECTION, {select: DAO.PROJECT_ALL, where: {uid: uid}}, function (err, result) {
            var siteName = (!uid || uid === SiteUtils.GLOBAL_SITE) ? 'global' : '';

            if (_.isError(err)) {
                log.error(err);
                return cb(err);
            }
            else if (result && result.length > 0) {
                siteName = result[0].displayName;
            }
            cb(null, siteName);
        });
    }

    /**
     * Checks to see if a proposed site display name or hostname is already in the system
     * @method isDisplayNameOrHostnameTaken
     * @param {String}   displayName - desired name to display
     * @param {String}   hostname - hostname of the site
     * @param {String}   id - Site object Id to exclude from the search
     * @param {Function} cb - Callback function
     */
    isDisplayNameOrHostnameTaken (displayName, hostname, id, cb) {
        this.getExistingDisplayNameHostnameCounts(displayName, hostname, id, function (err, results) {

            var result = results === null;
            if (!result) {
                result = results.reduce(function (reduction, value) {
                    return reduction || (value > 0);
                }, result);
            }
            cb(err, result);
        });
    }

    /**
     * Gets the total counts of a display name and hostname in the site collection
     *
     * @method getExistingDisplayNameHostnameCounts
     * @param {String}   displayName - site display name
     * @param {String}   hostname - site hostname
     * @param {String}   id - Site object Id to exclude from the search
     * @param {Function} cb - Callback function
     */
    getExistingDisplayNameHostnameCounts (displayName, hostname, id, cb) {
        if (_.isFunction(id)) {
            cb = id;
            id = null;
        }

        var getWhere = function (where) {
            if (id) {
                where[DAO.getIdField()] = DAO.getNotIdField(id);
            }
            return where;
        };
        var dao = new DAO();
        var tasks = {
            displayName: function (callback) {
                var exp = RegExpUtils.getCaseInsensitiveExact(displayName);
                dao.count('site', getWhere({displayName: exp}), callback);
            },
            hostname: function (callback) {
                dao.count('site', getWhere({hostname: hostname.toLowerCase()}), callback);
            }
        };
        async.parallel(tasks, cb);
    }

    /**
     * Run a job to activate a site so that all of its routes are available.
     * @method activateSite
     * @param {String} siteUid - site unique id
     * @param {Function} cb - callback to run after job is completed
     * @return {String} the job id
     */
    activateSite(siteUid, cb) {

        var name = util.format("ACTIVATE_SITE_%s", siteUid);
        var job = new SiteActivateJob({ siteService: this });
        job.setRunAsInitiator(true);
        job.init(name);
        job.setSite({uid: siteUid});
        job.run(cb);
        return job.getId();
    }

    /**
     * Run a job to set a site inactive so that only the admin routes are available.
     * @method deactivateSite
     * @param {String} siteUid - site unique id
     * @param {Function} cb - callback to run after job is completed
     * @return {String} the job id
     */
    deactivateSite(siteUid, cb) {

        var name = util.format("DEACTIVATE_SITE_%s", siteUid);
        var job = new SiteDeactivateJob();
        job.setRunAsInitiator(true);
        job.init(name);
        job.setSite({uid: siteUid});
        job.run(cb);
        return job.getId();
    }

    /**
     * Run a job to update a site's hostname and/or displayname.
     * @method editSite
     * @param {Object} options - object containing site fields
     * @param {String} options.uid - site uid
     * @param {String} options.hostname - result of site hostname edit/create
     * @param {String} options.displayName - result of site display name edit/create
     * @param {Function} cb - callback to run after job is completed
     * @return {String} the job id
     */
    editSite(options, cb) {
        var name = util.format("EDIT_SITE%s", options.uid);
        var job = new SiteCreateEditJob();
        job.setRunAsInitiator(true);
        job.init(name);
        job.setSite(options);
        job.run(cb);
        return job.getId();
    }

    /**
     * Creates a site and saves it to the database.
     * @method createSite
     * @param {Object} options - object containing site fields
     * @param {String} options.hostname - result of site hostname edit/create
     * @param {String} options.displayName - result of site display name edit/create
     * @param {Function} cb - callback function
     */
    createSite(options, cb) {
        options.active = false;
        options.uid = uuid.v4();
        return this.editSite(options, cb);
    }

    /**
     * Given a site uid, activate if the site exists so that user facing routes are on.
     * @method startAcceptingSiteTraffic
     * @param {String} siteUid - site unique id
     * @param {Function} cb - callback function
     */
    startAcceptingSiteTraffic(siteUid, cb) {
        var dao = new DAO();
        dao.loadByValue('uid', siteUid, 'site', function (err, site) {
            if (_.isError(err)) {
                cb(err, null);
            }
            else if (!site) {
                cb(new Error('Site not found'), null);
            }
            else if (!site.active) {
                cb(new Error('Site not active'), null);
            }
            else {
                ActiveSiteService.activate(siteUid);
                cb(err, site);
            }
        });
    }

    /**
     * Given a site uid, deactivate if the site exists so that user facing routes are off.
     * @method stopAcceptingSiteTraffic
     * @param {String} siteUid - site unique id
     * @param {Function} cb - callback function
     */
    stopAcceptingSiteTraffic(siteUid, cb) {
        var dao = new DAO();
        dao.loadByValue('uid', siteUid, 'site', function (err, site) {
            if (_.isError(err)) {
                cb(err, null);
            }
            else if (!site) {
                cb(new Error('Site not found'), null);
            }
            else if (site.active) {
                cb(new Error('Site not deactivated'), null);
            }
            else {
                ActiveSiteService.deactivate(siteUid);
                cb(err, site);
            }
        });
    }

    /**
     * Load all sites into memory.
     * @method initSites
     * @param {Function} cb
     */
    initSites(cb) {
        var config = Configuration.active;
        if (config.multisite.enabled && !config.multisite.globalRoot) {
            return cb(new Error("A Global Hostname must be configured with multisite turned on."), false);
        }
        this.getAllSites(function (err, results) {
            if (err) {
                return cb(err);
            }

            var defaultLocale = Localization.getDefaultLocale();
            var defaultSupportedLocales = {};
            defaultSupportedLocales[defaultLocale] = true;
            //only load the sites when we are in multi-site mode
            if (config.multisite.enabled) {
                results.forEach(function (site) {
                    site.defaultLocale = site.defaultLocale || defaultLocale;
                    site.supportedLocales = site.supportedLocales || defaultSupportedLocales;
                    site.prevHostnames = site.prevHostnames || [];
                    ActiveSiteService.register(site);
                });
            }

            // To remain backwards compatible, hostname is siteRoot for single tenant
            // and active allows all routes to be hit.
            // When multisite, use the configured hostname for global, turn off public facing routes,
            // and maintain admin routes (active is false).
            ActiveSiteService.register(SiteUtils.getGlobalSiteContext());
            cb(err, true);
        });
    }

    /**
     * Runs a site activation job when command is received.
     * @static
     * @method onActivateSiteCommandReceived
     * @param {Object} command - the command to react to.
     */
    static onActivateSiteCommandReceived(command) {
        if (!_.isObject(command)) {
            log.error('SiteService: an invalid activate_site command object was passed. %s', util.inspect(command));
            return;
        }

        var name = util.format("ACTIVATE_SITE_%s", command.site);
        var job = new SiteActivateJob();
        job.setRunAsInitiator(false);
        job.init(name, command.jobId);
        job.setSite(command.site);
        job.run(function (err, result) {
            var response = {
                error: err ? err.stack : undefined,
                result: result ? true : false
            };
            CommandService.getInstance().sendInResponseTo(command, response);
        });
    }

    /**
     * Runs a site deactivation job when command is received.
     * @static
     * @method onDeactivateSiteCommandReceived
     * @param {Object} command - the command to react to.
     */
    static onDeactivateSiteCommandReceived(command) {
        if (!_.isObject(command)) {
            log.error('SiteService: an invalid deactivate_site command object was passed. %s', util.inspect(command));
            return;
        }

        var name = util.format("DEACTIVATE_SITE_%s", command.site);
        var job = new SiteDeactivateJob();
        job.setRunAsInitiator(false);
        job.init(name, command.jobId);
        job.setSite(command.site);
        job.run(function (err, result) {
            var response = {
                error: err ? err.stack : undefined,
                result: result ? true : false
            };
            CommandService.getInstance().sendInResponseTo(command, response);
        });
    }

    /**
     * Runs a site deactivation job when command is received.
     * @static
     * @method onCreateEditSiteCommandReceived
     * @param {Object} command - the command to react to.
     */
    static onCreateEditSiteCommandReceived(command) {
        if (!_.isObject(command)) {
            log.error('SiteService: an invalid create_edit_site command object was passed. %s', util.inspect(command));
            return;
        }

        var name = util.format("CREATE_EDIT_SITE%s", command.site);
        var job = new SiteCreateEditJob();
        job.setRunAsInitiator(false);
        job.init(name, command.jobId);
        job.setSite(command.site);
        job.run(function (err, result) {
            var response = {
                error: err ? err.stack : undefined,
                result: result ? true : false
            };
            CommandService.getInstance().sendInResponseTo(command, response);
        });
    }

    /**
     * Register activate and deactivate commands on initialization
     * @static
     * @method init
     */
    static init() {
        var commandService = CommandService.getInstance();
        commandService.registerForType('activate_site', SiteService.onActivateSiteCommandReceived);
        commandService.registerForType('deactivate_site', SiteService.onDeactivateSiteCommandReceived);
        commandService.registerForType('create_edit_site', SiteService.onCreateEditSiteCommandReceived);
    }

    /**
     * TODO [1.0] remove bc it moved to site utils
     * Returns true if both site ids given are equal
     * @method areEqual
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

    /**
     * TODO [1.0] remove bc it moved to site utils
     * Returns true if actual is not set (falsey) or logically equivalent to expected in terms of sites
     * @method isNotSetOrEqual
     * @param {String} actual - site to check
     * @param {String} expected - site you expect to be equal
     * @return {Boolean} true if actual exists and equals expected
     */
    static isNotSetOrEqual(actual, expected) {
        return !actual || SiteService.areEqual(actual, expected);
    }

    /**
     * Central place to get the current site. Backwards compatible cleansing
     * @method getCurrentSite
     * @param {String} siteid - site is to cleanse
     * @return {String} SiteUtils.GLOBAL_SITE if not specified, or siteid otherwise
     */
    static getCurrentSite (siteid) {
        return siteid || SiteUtils.GLOBAL_SITE;
    }

    /**
     * Return site field from object.
     * @method getSiteFromObject
     * @param {Object} object
     * @return {String} the value of the object's site field key
     */
    static getSiteFromObject (object) {
        if (!object) {
            return SiteService.NO_SITE;
        }
        return object[SiteUtils.SITE_FIELD];
    }

    /**
     * @method deleteSiteSpecificContent
     * @param {String} siteId
     * @param {Function} cb
     */
    deleteSiteSpecificContent (siteId, cb) {
        var siteQueryService = new SiteQueryService();
        siteQueryService.getCollections(function (err, allCollections) {
            var dao = new DAO();

            var tasks = allCollections.map(function (collection) {
                return function (taskCallback) {
                    dao.delete({site: siteId}, collection.name, function (err, commandResult) {
                        if (_.isError(err) || !commandResult) {
                            return taskCallback(err);
                        }

                        taskCallback(null, {collection: collection.name});
                    });
                };
            });
            async.parallel(tasks, function (err, results) {
                if (_.isError(err)) {
                    log.error(err);
                    return cb(err);
                }
                log.silly('Successfully deleted site %s from database', siteId);
                cb(null, results);
            });
        });
    }

    static buildPrevHostnames (data, object) {
        var prevHostname = object.hostname;
        var newHostname = data.hostname;
        // If this site's hostname has been changed, save off a redirectHost
        if ((prevHostname && newHostname) && (prevHostname !== newHostname)) {
            // Check for circular hostname references
            data.prevHostnames = data.prevHostnames.filter(function (hostname) {
                return hostname !== newHostname;
            });
            data.prevHostnames.push(prevHostname);
            RequestHandler.redirectHosts[prevHostname] = newHostname;
            RequestHandler.sites[prevHostname] = null;
        }
        return data;
    }

    static merge (context, cb) {
        if (!context.data.prevHostnames) {
            context.data.prevHostnames = [];
        }
        context.data = SiteService.buildPrevHostnames(context.data, context.object);

        Object.assign(context.object, context.data);
        cb(null);
    }

    static beforeDelete(context, cb) {
        var siteid = context.data.uid;
        context.service.deleteSiteSpecificContent(siteid, cb);
    }
}

BaseObjectService.on(SiteService.TYPE + '.' + BaseObjectService.MERGE, SiteService.merge);
BaseObjectService.on(SiteService.TYPE + '.' + BaseObjectService.BEFORE_DELETE, SiteService.beforeDelete);

module.exports = SiteService;
