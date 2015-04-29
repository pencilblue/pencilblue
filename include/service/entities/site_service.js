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

    return SiteService;
};
