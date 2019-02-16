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
    LocalizationService.prototype.updateLocales = function(siteUID, cb) {
        cb = cb || util.cb;

        var name = util.format("UPDATE_LOCALES_FOR_%s", siteUID);
        var job = new pb.LocalizationUpdateJob();
        job.setRunAsInitiator(true);
        job.init(name);
        job.setSite({uid: siteUID});
        job.run(cb);
        return job.getId();
    };

    /**
     * Runs an update localization.storage job when command is received.
     * @static
     * @method onUpdateLocalesCommandReceived
     * @param {Object} command - the command to react to.
     */
    LocalizationService.onUpdateLocalesCommandReceived = function(command) {
        if (!util.isObject(command)) {
            pb.log.error('LocalizationService: an invalid update_locales command object was passed. %s', util.inspect(command));
            return;
        }

        var name = util.format("UPDATE_LOCALES_FOR_%s", command.site);
        var job = new pb.LocalizationUpdateJob();
        job.setRunAsInitiator(false);
        job.init(name, command.jobId);
        job.setSite({uid: command.site});
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
        commandService.registerForType('update_locales', LocalizationService.onUpdateLocalesCommandReceived);
    };

    return LocalizationService;
};
