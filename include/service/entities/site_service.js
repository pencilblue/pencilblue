var async = require('async');
var util  = require('../../util.js');

module.exports = function SiteServiceModule(pb) {


    /**
     * Service for performing site specific operations.
     *
     * @module Services
     * @submodule Entities
     * @class SiteService
     * @constructor
     */
    function SiteService(){}

    SiteService.GLOBAL_SITE = 'global';
    SiteService.SITE_FIELD = 'site';
    SiteService.SITE_COLLECTION = 'site';
    var SITE_COLL = SiteService.SITE_COLLECTION;

    SiteService.prototype.getActiveSites = function(cb) {
        var dao = new pb.DAO();
        dao.q(SITE_COLL, { select: pb.DAO.SELECT_ALL, where: {active: true} }, cb);
    }

    SiteService.prototype.getInactiveSites = function(cb) {
        var dao = new pb.DAO();
        dao.q(SITE_COLL, {where: {active: false}}, cb);
    }

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
        async.series(tasks, function(err, results) {
            cb(err, results);
        });
    };

    /**
     * Checks to see if a proposed site display name or hostname is already in the system
     *
     * @method isDisplayNameOrHostnameTaken
     * @param {String}   displayName
     * @param {String}   hostname
     * @param {String}   id       Site object Id to exclude from the search
     * @param {Function} cb       Callback function
     */
    SiteService.prototype.isDisplayNameOrHostnameTaken = function(displayName, hostname, id, cb) {
        this.getExistingDisplayNameHostnameCounts(displayName, hostname, id, function(err, results) {

            var result = results === null;
            if (!result) {
                for(var key in results) {
                    result |= results[key] > 0;
                }
            }
            cb(err, result);
        });
    };


    /**
     * Gets the total counts of a display name and hostname in the site collection
     *
     * @method getExistingDisplayNameHostnameCounts
     * @param {String}   displayName
     * @param {String}   hostname
     * @param {String}   id       Site object Id to exclude from the search
     * @param {Function} cb       Callback function
     */
    SiteService.prototype.getExistingDisplayNameHostnameCounts = function(displayName, hostname, id, cb) {
        if (util.isFunction(id)) {
            cb = id;
            id = null;
        }

        var getWhere = function(where) {
            if (id) {
                where[pb.DAO.getIdField()] = pb.DAO.getNotIDField(id);
            }
            return where;
        };
        var dao   = new pb.DAO();
        var tasks = {
            displayName: function(callback) {
                var expStr = util.escapeRegExp(displayName.toLowerCase) + '$';
                dao.count('site', getWhere({displayName: new RegExp(expStr, 'i')}), callback);
            },
            hostname: function(callback) {
                dao.count('site', getWhere({hostname: hostname.toLowerCase()}), callback);
            }
        };
        async.series(tasks, cb);
    };

    SiteService.prototype.activateSite = function(siteUid, cb) {
        cb = cb || util.cb;
        var name = util.format("ACTIVATE_SITE_%s", siteUid);
        var job = new pb.SiteActivateJob();
        job.setRunAsInitiator(true);
        job.init(name);
        job.setSite(siteUid);
        job.run(cb);
        return job.getId();
    };

    SiteService.prototype.deactivateSite = function(siteUid, cb) {
        cb = cb || util.cb;
        var name = util.format("DEACTIVATE_SITE_%s", siteUid);
        var job = new pb.SiteDeactivateJob();
        job.setRunAsInitiator(true);
        job.init(name);
        job.setSite(siteUid);
        job.run(cb);
        return job.getId();
    };

    SiteService.prototype.createSite = function(site, id, cb) {
        site.active = false;
        site.uid = getUid();
        this.isDisplayNameOrHostnameTaken(site.displayName, site.hostname, id, function(err, isTaken, field) {
            if(util.isError(err) || isTaken) {
                cb(err, isTaken, field, null);
                return;
            }

            var dao = new pb.DAO();
            dao.save(site, function(err, result) {
                if(util.isError(err)) {
                    cb(err, false, null, null);
                    return;
                }

                cb(null, false, null, result);
            });
        });
    };

    SiteService.prototype.startAcceptingSiteTraffic = function(siteUid, cb) {
        var dao = new pb.DAO();
        dao.loadByValue('uid', siteUid, 'site', function(err, site) {
            if(util.isError(err)) {
                cb(err, null)
            } else if (!site) {
                cb(new Error('Site not found'), null);
            } else if (!site.active) {
                cb(new Error('Site not active'), null);
            } else {
                pb.RequestHandler.loadSite(site);
                cb(err, result)
            }
        });
    };

    SiteService.prototype.stopAcceptingSiteTraffic = function(siteUid, cb) {
        var dao = new pb.DAO();
        dao.loadByValue('uid', siteUid, 'site', function(err, site) {
            if(util.isError(err)) {
                cb(err, null)
            } else if (!site) {
                cb(new Error('Site not found'), null);
            } else if (site.active) {
                cb(new Error('Site not deactivated'), null);
            } else {
                pb.RequestHandler.unloadSite(site);
                cb(err, result)
            }
        });
    };

    SiteService.prototype.initSites = function(cb) {
        this.getActiveSites(function(err, results) {            
            if(err) {
                cb(err);
            } else {
                util.forEach(results, function(site) {
                    pb.RequestHandler.loadSite(site);
                })
                cb(err,true);
            }
        });
    };

    function getUid()
    {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {var r = Math.random()*16|0,v=c=='x'?r:r&0x3|0x8;return v.toString(16);});
    }

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
     *
     * @static
     * @method init
     */
    SiteService.init = function() {
        //register for commands
        var commandService = pb.CommandService.getInstance();
        commandService.registerForType('deactivate_site', SiteService.onActivateSiteCommandReceived);
        commandService.registerForType('activate_site'  , SiteService.onDeactivateSiteCommandReceived);
    };

    /**
     * Central place to get the current site
     *
     * @param pathVars
     * @returns {string} empty string if multisite is not enabled; SiteService.GLOBAL_SITE if not specified, or siteid otherwise
     */
    SiteService.getCurrentSite = function(pathVars) {
        return pb.config.multisite ?
          (pathVars.siteid || SiteService.GLOBAL_SITE)
          : '';
    };

    /**
     * Gets the current site prefix based on pathVars; this is equivalent to getCurrentSite with a leading slash
     * @param pathVars
     */
    SiteService.getCurrentSitePrefix = function(pathVars) {
        return '/' + SiteService.getCurrentSite(pathVars);
    };

    return SiteService;
};
