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

var async = require('async');
var url = require('url');
var util  = require('../../util.js');

module.exports = function SiteServiceModule(pb) {
    /**
     * Service for performing site specific operations.
     * @class SiteService
     * @constructor
     */
    function SiteService(context) {
        if (!util.isObject(context)) {
            context = {};
        }

        context.type = TYPE;
        SiteService.super_.call(this, context);
        this.dao = new pb.DAO();
    }
    util.inherits(SiteService, pb.BaseObjectService);

  /**
   * The name of the DB collection where the resources are persisted
   * @private
   * @static
   * @readonly
   * @property TYPE
   * @type {String}
   */
  var TYPE = 'site';

    /**
     * represents default configuration, not actually a full site
     * @static
     * @readonly
     * @property GLOBAL_SITE
     * @type {String}
     */
    SiteService.GLOBAL_SITE = 'global';

    /**
     * represents a site that doesn't exist
     * @static
     * @readonly
     * @property NO_SITE
     * @type {String}
     */
    SiteService.NO_SITE = 'no-site';

    /**
     *
     * @static
     * @readonly
     * @property SITE_FIELD
     * @type {String}
     */
    SiteService.SITE_FIELD = 'site';

    /**
     *
     * @static
     * @readonly
     * @property SITE_COLLECTION
     * @type {String}
     */
    SiteService.SITE_COLLECTION = 'site';

    /**
     *
     * @private
     * @static
     * @readonly
     * @property SITE_COLL
     * @type {String}
     */
    var SITE_COLL = SiteService.SITE_COLLECTION;

    /**
     * Load full site config from the database using the unique id.
     * @method getByUid
     * @param {String} uid - unique id of site
     * @param {Function} cb - the callback function
     */
    SiteService.prototype.getByUid = function(uid, cb) {
        if(!uid || uid === SiteService.GLOBAL_SITE) {
            cb(null, {
                displayName:pb.config.siteName,
                hostname: pb.config.siteRoot,
                uid: SiteService.GLOBAL_SITE,
                defaultLocale: pb.Localization.defaultLocale,
                supportedLocales: {}
            });
        }
        else {
            var dao = new pb.DAO();
            var where = {uid: uid};
            dao.loadByValues(where, SITE_COLL, cb);
        }
    };

    /**
     * Get all of the site objects in the database
     * @method getAllSites
     * @param {Function} cb - the callback function
     */
    SiteService.prototype.getAllSites = function(cb) {
        var dao = new pb.DAO();
        dao.q(SITE_COLL, { select: pb.DAO.PROJECT_ALL, where: {} }, cb);
    };

    /**
     * Get all site objects where activated is true.
     * @method getActiveSites
     * @param {Function} cb - the callback function
     */
    SiteService.prototype.getActiveSites = function(cb) {
        var dao = new pb.DAO();
        dao.q(SITE_COLL, { select: pb.DAO.PROJECT_ALL, where: {active: true} }, cb);
    };

    /**
     * Get all site objects where activated is false.
     * @method getInactiveSites
     * @param {Function} cb - the callback function
     */
    SiteService.prototype.getInactiveSites = function(cb) {
        var dao = new pb.DAO();
        dao.q(SITE_COLL, {where: {active: false}}, cb);
    };

    /**
     * Get all site objects segmented by active status.
     * @method getSiteMap
     * @param {Function} cb - the callback function
     */
    SiteService.prototype.getSiteMap = function(cb) {
        var self  = this;
        var tasks = {
             active: function(callback) {
                 self.getActiveSites(callback);
             },

             inactive: function(callback) {
                 self.getInactiveSites(callback);
             }
        };
        async.series(tasks, cb);
    };

    /**
     * Get site name given a unique id.
     * @method getSiteNameByUid
     * @param {String} uid - unique id
     * @param {Function} cb - the callback function
     */
    SiteService.prototype.getSiteNameByUid = function(uid, cb) {
        var dao = new pb.DAO();
        dao.q(SITE_COLL, {select: pb.DAO.PROJECT_ALL, where: {uid: uid} }, function(err, result) {
            var siteName = (!uid || uid === SiteService.GLOBAL_SITE) ? 'global' : '';

            if (pb.util.isError(err)) {
                pb.log.error(err);
                return cb(err);
            }
            else if (result && result.length > 0) {
                siteName = result[0].displayName;
            }
            cb(null, siteName);
        });
    };

    /**
     * Checks to see if a proposed site display name or hostname is already in the system
     * @method isDisplayNameOrHostnameTaken
     * @param {String}   displayName - desired name to display
     * @param {String}   hostname - hostname of the site
     * @param {String}   id - Site object Id to exclude from the search
     * @param {Function} cb - Callback function
     */
    SiteService.prototype.isDisplayNameOrHostnameTaken = function(displayName, hostname, id, cb) {
        this.getExistingDisplayNameHostnameCounts(displayName, hostname, id, function(err, results) {

            var result = results === null;
            if (!result) {
                util.forEach(results, function(value) {
                    result |= value > 0;
                });
            }
            cb(err, result);
        });
    };

    /**
     * Gets the total counts of a display name and hostname in the site collection
     *
     * @method getExistingDisplayNameHostnameCounts
     * @param {String}   displayName - site display name
     * @param {String}   hostname - site hostname
     * @param {String}   id - Site object Id to exclude from the search
     * @param {Function} cb - Callback function
     */
    SiteService.prototype.getExistingDisplayNameHostnameCounts = function(displayName, hostname, id, cb) {
        if (util.isFunction(id)) {
            cb = id;
            id = null;
        }

        var getWhere = function(where) {
            if (id) {
                where[pb.DAO.getIdField()] = pb.DAO.getNotIdField(id);
            }
            return where;
        };
        var dao   = new pb.DAO();
        var tasks = {
            displayName: function(callback) {
                var expStr = '^' + util.escapeRegExp(displayName.toLowerCase()) + '$';
                dao.count('site', getWhere({displayName: new RegExp(expStr, 'i')}), callback);
            },
            hostname: function(callback) {
                dao.count('site', getWhere({hostname: hostname.toLowerCase()}), callback);
            }
        };
        async.parallel(tasks, cb);
    };

    /**
     * Run a job to activate a site so that all of its routes are available.
     * @method activateSite
     * @param {String} siteUid - site unique id
     * @param {Function} cb - callback to run after job is completed
     * @return {String} the job id
     */
    SiteService.prototype.activateSite = function(siteUid, cb) {
        cb = cb || util.cb;
        var name = util.format("ACTIVATE_SITE_%s", siteUid);
        var job = new pb.SiteActivateJob();
        job.setRunAsInitiator(true);
        job.init(name);
        job.setSite({uid: siteUid});
        job.run(cb);
        return job.getId();
    };


    /**
     * Run a job to set a site inactive so that only the admin routes are available.
     * @method deactivateSite
     * @param {String} siteUid - site unique id
     * @param {Function} cb - callback to run after job is completed
     * @return {String} the job id
     */
    SiteService.prototype.deactivateSite = function(siteUid, cb) {
        cb = cb || util.cb;
        var name = util.format("DEACTIVATE_SITE_%s", siteUid);
        var job = new pb.SiteDeactivateJob();
        job.setRunAsInitiator(true);
        job.init(name);
        job.setSite({uid: siteUid});
        job.run(cb);
        return job.getId();
    };

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
    SiteService.prototype.editSite = function(options, cb) {
        cb = cb || util.cb;
        var name = util.format("EDIT_SITE%s", options.uid);
        var job = new pb.SiteCreateEditJob();
        job.setRunAsInitiator(true);
        job.init(name);
        job.setSite(options);
        job.run(cb);
        return job.getId();
    };

    /**
     * Creates a site and saves it to the database.
     * @method createSite
     * @param {Object} options - object containing site fields
     * @param {String} options.hostname - result of site hostname edit/create
     * @param {String} options.displayName - result of site display name edit/create
     * @param {Function} cb - callback function
     */
    SiteService.prototype.createSite = function(options, cb) {
        cb = cb || util.cb;
        options.active = false;
        options.uid = util.uniqueId();
        return this.editSite(options, cb);
    };

    /**
     * Given a site uid, activate if the site exists so that user facing routes are on.
     * @method startAcceptingSiteTraffic
     * @param {String} siteUid - site unique id
     * @param {Function} cb - callback function
     */
    SiteService.prototype.startAcceptingSiteTraffic = function(siteUid, cb) {
        var dao = new pb.DAO();
        dao.loadByValue('uid', siteUid, 'site', function(err, site) {
            if(util.isError(err)) {
                cb(err, null);
            }
            else if (!site) {
                cb(new Error('Site not found'), null);
            }
            else if (!site.active) {
                cb(new Error('Site not active'), null);
            }
            else {
                pb.RequestHandler.activateSite(site);
                cb(err, site);
            }
        });
    };

    /**
     * Given a site uid, deactivate if the site exists so that user facing routes are off.
     * @method stopAcceptingSiteTraffic
     * @param {String} siteUid - site unique id
     * @param {Function} cb - callback function
     */
    SiteService.prototype.stopAcceptingSiteTraffic = function(siteUid, cb) {
        var dao = new pb.DAO();
        dao.loadByValue('uid', siteUid, 'site', function(err, site) {
            if(util.isError(err)) {
                cb(err, null);
            }
            else if (!site) {
                cb(new Error('Site not found'), null);
            }
            else if (site.active) {
                cb(new Error('Site not deactivated'), null);
            }
            else {
                pb.RequestHandler.deactivateSite(site);
                cb(err, site);
            }
        });
    };

    /**
     * Load all sites into memory.
     * @method initSites
     * @param {Function} cb
     */
    SiteService.prototype.initSites = function(cb) {
        if (pb.config.multisite.enabled && !pb.config.multisite.globalRoot) {
            return cb(new Error("A Global Hostname must be configured with multisite turned on."), false);
        }
        this.getAllSites(function (err, results) {
            if (err) {
                return cb(err);
            }

            var defaultLocale = pb.Localization.getDefaultLocale();
            var defaultSupportedLocales = {};
            defaultSupportedLocales[defaultLocale] = true;
            //only load the sites when we are in multi-site mode
            if (pb.config.multisite.enabled) {
                util.forEach(results, function (site) {
                    site.defaultLocale = site.defaultLocale || defaultLocale;
                    site.supportedLocales = site.supportedLocales || defaultSupportedLocales;
                    site.prevHostnames = site.prevHostnames || [];
                    pb.RequestHandler.loadSite(site);
                });
            }

            // To remain backwards compatible, hostname is siteRoot for single tenant
            // and active allows all routes to be hit.
            // When multisite, use the configured hostname for global, turn off public facing routes,
            // and maintain admin routes (active is false).
            pb.RequestHandler.loadSite(SiteService.getGlobalSiteContext());
            cb(err, true);
        });
    };

    /**
     * Runs a site activation job when command is received.
     * @static
     * @method onActivateSiteCommandReceived
     * @param {Object} command - the command to react to.
     */
    SiteService.onActivateSiteCommandReceived = function(command) {
        if (!util.isObject(command)) {
            pb.log.error('SiteService: an invalid activate_site command object was passed. %s', util.inspect(command));
            return;
        }

        var name = util.format("ACTIVATE_SITE_%s", command.site);
        var job = new pb.SiteActivateJob();
        job.setRunAsInitiator(false);
        job.init(name, command.jobId);
        job.setSite(command.site);
        job.run(function(err, result) {
            var response = {
                error: err ? err.stack : undefined,
                result: result ? true : false
            };
            pb.CommandService.getInstance().sendInResponseTo(command, response);
        });
    };

    /**
     * Runs a site deactivation job when command is received.
     * @static
     * @method onDeactivateSiteCommandReceived
     * @param {Object} command - the command to react to.
     */
    SiteService.onDeactivateSiteCommandReceived = function(command) {
        if (!util.isObject(command)) {
            pb.log.error('SiteService: an invalid deactivate_site command object was passed. %s', util.inspect(command));
            return;
        }

        var name = util.format("DEACTIVATE_SITE_%s", command.site);
        var job = new pb.SiteDeactivateJob();
        job.setRunAsInitiator(false);
        job.init(name, command.jobId);
        job.setSite(command.site);
        job.run(function(err, result) {
            var response = {
                error: err ? err.stack : undefined,
                result: result ? true : false
            };
            pb.CommandService.getInstance().sendInResponseTo(command, response);
        });
    };

    /**
     * Runs a site deactivation job when command is received.
     * @static
     * @method onCreateEditSiteCommandReceived
     * @param {Object} command - the command to react to.
     */
    SiteService.onCreateEditSiteCommandReceived = function(command) {
        if (!util.isObject(command)) {
            pb.log.error('SiteService: an invalid create_edit_site command object was passed. %s', util.inspect(command));
            return;
        }

        var name = util.format("CREATE_EDIT_SITE%s", command.site);
        var job = new pb.SiteCreateEditJob();
        job.setRunAsInitiator(false);
        job.init(name, command.jobId);
        job.setSite(command.site);
        job.run(function(err, result) {
            var response = {
                error: err ? err.stack : undefined,
                result: result ? true : false
            };
            pb.CommandService.getInstance().sendInResponseTo(command, response);
        });
    };

    /**
     * Register activate and deactivate commands on initialization
     * @static
     * @method init
     */
    SiteService.init = function() {
        var commandService = pb.CommandService.getInstance();
        commandService.registerForType('activate_site', SiteService.onActivateSiteCommandReceived);
        commandService.registerForType('deactivate_site'  , SiteService.onDeactivateSiteCommandReceived);
        commandService.registerForType('create_edit_site', SiteService.onCreateEditSiteCommandReceived);
    };

    /**
     * Returns true if siteId given is global or non-existent (to remain backwards compatible)
     * @method isGlobal
     * @param {String} siteId - the site id to check
     * @return {Boolean} true if global or does not exist
     */
    SiteService.isGlobal = function (siteId) {
        return (!siteId || siteId === SiteService.GLOBAL_SITE);
    };

    /**
     * Returns true if both site ids given are equal
     * @method areEqual
     * @param {String} siteA - first site id to compare
     * @param {String} siteB - second site id to compare
     * @return {Boolean} true if equal, false otherwise
     */
    SiteService.areEqual = function (siteA, siteB) {
        if (SiteService.isGlobal(siteA) && SiteService.isGlobal(siteB)) {
            return true;
        }
        return siteA === siteB;
    };

    /**
     * Returns true if actual is not set (falsey) or logically equivalent to expected in terms of sites
     * @method isNotSetOrEqual
     * @param {String} actual - site to check
     * @param {String} expected - site you expect to be equal
     * @return {Boolean} true if actual exists and equals expected
     */
    SiteService.isNotSetOrEqual = function (actual, expected) {
        return !actual || SiteService.areEqual(actual, expected);
    };

    /**
     * Central place to get the current site. Backwards compatible cleansing
     * @method getCurrentSite
     * @param {String} siteid - site is to cleanse
     * @return {String} SiteService.GLOBAL_SITE if not specified, or siteid otherwise
     */
    SiteService.getCurrentSite = function (siteid) {
        return siteid || SiteService.GLOBAL_SITE;
    };

    /**
     * Return site field from object.
     * @method getSiteFromObject
     * @param {Object} object
     * @return {String} the value of the object's site field key
     */
    SiteService.getSiteFromObject = function (object) {
        if (!object) {
            return SiteService.NO_SITE;
        }
        return object[SiteService.SITE_FIELD];
    };

    /**
     * Determine whether http or https is being used for the site and return hostname attached to http(s)
     * @method getHostWithProtocol
     * @param {String} hostname
     * @return {String} hostname with protocol attached
     */
    SiteService.getHostWithProtocol = function(hostname) {
        hostname = hostname.match(/^http/g) ? hostname : "//" + hostname;
        var urlObject = url.parse(hostname, false, true);
        urlObject.protocol = pb.config.server.ssl.enabled ? 'https' : 'http';
        return url.format(urlObject).replace(/\/$/, '');
    };

    /**
     * @method deleteSiteSpecificContent
     * @param {String} siteId
     * @param {Function} cb
     */
    SiteService.prototype.deleteSiteSpecificContent = function (siteId, cb) {
        var siteQueryService = new pb.SiteQueryService();
        siteQueryService.getCollections(function(err, allCollections) {
            var dao = new pb.DAO();

            var tasks = util.getTasks(allCollections, function (collections, i) {
                return function (taskCallback) {
                    dao.delete({site: siteId}, collections[i].name, function (err, commandResult) {
                        if (util.isError(err) || !commandResult) {
                            return taskCallback(err);
                        }

                        taskCallback(null, {collection: collections[i].name});
                    });
                };
            });
            async.parallel(tasks, function (err, results) {
                if (pb.util.isError(err)) {
                    pb.log.error(err);
                    return cb(err);
                }
                pb.log.silly("Successfully deleted site %s from database", siteId);
                cb(null, results);
            });
        });
    };

    /**
     * Retrieves the global site context
     * @static
     * @method getGlobalSiteContext
     * @return {Object}
     */
    SiteService.getGlobalSiteContext = function() {
        return {
            displayName: pb.config.siteName,
            uid: pb.SiteService.GLOBAL_SITE,
            hostname: pb.config.multisite.enabled ? url.parse(pb.config.multisite.globalRoot).host : url.parse(pb.config.siteRoot).host,
            active: !pb.config.multisite.enabled,
            defaultLocale: pb.Localization.getDefaultLocale(),
            supportedLocales: util.arrayToObj(pb.Localization.getSupported(), function(a, i) { return a[i]; }, function() { return true; }),
            prevHostnames: []
        };
    };

    SiteService.buildPrevHostnames = function(data, object) {
        var prevHostname = object.hostname;
        var newHostname = data.hostname;
        // If this site's hostname has been changed, save off a redirectHost
        if ((prevHostname && newHostname) && (prevHostname !== newHostname)) {
            // Check for circular hostname references
            data.prevHostnames = data.prevHostnames.filter(function (hostname) {
                return hostname !== newHostname;
            });
            data.prevHostnames.push(prevHostname);
            pb.RequestHandler.redirectHosts[prevHostname] = newHostname;
            pb.RequestHandler.sites[prevHostname] = null;
        }
        return data;
    };

    SiteService.merge = function (context, cb) {
        if (!context.data.prevHostnames) {
            context.data.prevHostnames = [];
        }
        context.data = SiteService.buildPrevHostnames(context.data, context.object);

        pb.util.merge(context.data, context.object);
        cb(null);
    };

    SiteService.beforeDelete = function (context, cb) {
        var siteid = context.data.uid;
        context.service.deleteSiteSpecificContent(siteid, cb);
    };

    pb.BaseObjectService.on(TYPE + '.' + pb.BaseObjectService.MERGE, SiteService.merge);
    pb.BaseObjectService.on(TYPE + '.' + pb.BaseObjectService.BEFORE_DELETE, SiteService.beforeDelete);

    return SiteService;
};
