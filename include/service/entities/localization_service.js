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

var async = require('async');
var url = require('url');
var util  = require('../../util.js');

module.exports = function LocalizationServiceModule(pb) {
    /**
     * Service for performing site specific operations.
     * @class SiteService
     * @constructor
     */
    function LocalizationService(context) {
        if (!util.isObject(context)) {
            context = {};
        }

        context.type = TYPE;
        LocalizationService.super_.call(this, context);
        this.dao = new pb.DAO();
    }
    util.inherits(LocalizationService, pb.BaseObjectService);

    /**
     * The name of the DB collection where the resources are persisted
     * @private
     * @static
     * @readonly
     * @property TYPE
     * @type {String}
     */
    var TYPE = 'localization';

    /**
     * Run a job to activate a site so that all of its routes are available.
     * @method activateSite
     * @param {String} siteUid - site unique id
     * @param {Function} cb - callback to run after job is completed
     * @returns {String} the job id
     */
    LocalizationService.prototype.updateLocalization = function(cb) {
        cb = cb || util.cb;
        var name = util.format("ACTIVATE_SITE_%s", siteUid);
        var job = new pb.LocalizationAddJob();
        job.setRunAsInitiator(true);
        job.init(name);
        job.setSite({uid: siteUid});
        job.run(cb);
        return job.getId();
    };

    /**
     * Load all sites into memory.
     * @method initSites
     * @param {Function} cb
     */
    LocalizationService.prototype.initSites = function(cb) {
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
            pb.RequestHandler.loadSite(LocalizationService.getGlobalSiteContext());
            cb(err, true);
        });
    };

    /**
     * Runs a site activation job when command is received.
     * @static
     * @method onActivateSiteCommandReceived
     * @param {Object} command - the command to react to.
     */
    LocalizationService.onActivateSiteCommandReceived = function(command) {
        if (!util.isObject(command)) {
            pb.log.error('LocalizationService: an invalid activate_site command object was passed. %s', util.inspect(command));
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
     * Register activate and deactivate commands on initialization
     * @static
     * @method init
     */
    LocalizationService.init = function() {
        var commandService = pb.CommandService.getInstance();
        commandService.registerForType('activate_site', LocalizationService.onActivateSiteCommandReceived);
        commandService.registerForType('deactivate_site'  , LocalizationService.onDeactivateSiteCommandReceived);
        commandService.registerForType('create_edit_site', LocalizationService.onCreateEditSiteCommandReceived);
    };

    LocalizationService.merge = function (context, cb) {
        if (!context.data.prevHostnames) {
            context.data.prevHostnames = [];
        }
        context.data = LocalizationService.buildPrevHostnames(context.data, context.object);

        pb.util.merge(context.data, context.object);
        cb(null);
    };

    return LocalizationService;
};
