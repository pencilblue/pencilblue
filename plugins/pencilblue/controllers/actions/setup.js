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
var async = require('async');

module.exports = function SetupActionControllerModule(pb) {

    //pb dependencies
    var util            = pb.util;
    var CallHomeService = pb.CallHomeService;

    /**
     * Creates the initial admin user
     * @class SetupActionController
     * @constructor
     * @extends BaseController
     */
    function SetupActionController(){}
    util.inherits(SetupActionController, pb.BaseController);

    /**
     * The setup events are ran in sequence.  The error key is mapped to the
     * task index + 1 so that on error you can check the result length to
     * determine which task errored.
     * @private
     * @static
     * @readonly
     * @property ERROR_KEYS
     * @type {Object}
     */
    var ERROR_KEYS = Object.freeze({
        1: 'generic.ERROR_CREATING_USER',
        2: 'generic.ERROR_SETTING_ACTIVE_THEME',
        3: 'generic.ERROR_SETTING_CONTENT_SETTINGS',
        4: 'generic.ERROR_SETTING_SYS_INITIALIZED',
        5: 'generic.ERROR_SETTING_CALLHOME'
    });

    /**
     *
     * @method render
     * @param {Function} cb
     */
    SetupActionController.prototype.render = function(cb) {

        var self = this;
        pb.settings.get('system_initialized', function(err, isSetup){
            if (util.isError(err)) {
                self.reqHandler.serveError(err);
                return;
            }

            //when user count is 1 or higher the system has already been initialized
            if (isSetup) {
                self.redirect('/', cb);
                return;
            }

            self.doSetup(cb);
        });
    };

    /**
     *
     * @method doSetup
     * @param {Function} cb
     */
    SetupActionController.prototype.doSetup = function(cb) {

        var self = this;
        this.getPostParams(function(err, post){
            if (util.isError(err)) {
                self.reqHandler.serveError(err);
                return;
            }

            self.onPostParamsRetrieved(post, cb);
        });
    };

    /**
     *
     * @method onPostParamsRetrieved
     * @param {Function} cb
     */
    SetupActionController.prototype.onPostParamsRetrieved = function(post, cb) {
        var self = this;

        var reqParams = ['username', 'email', 'password', 'confirm_password', 'call_home'];
        var message   = this.hasRequiredParams(post, reqParams);
        if(message) {
            this.formError(message, '/setup', cb);
            return;
        }

        //set the access level (role)
        post.admin = pb.SecurityService.ACCESS_ADMINISTRATOR;

        //get call home allowance
        var callHome = 1 == post.call_home;
        delete post.call_home;

        //do setup events
        var tasks = [
            function(callback) {
                var userDocument = pb.DocumentCreator.create('user', post);

                var dao = new pb.SiteQueryService({site: pb.SiteService.GLOBAL_SITE});
                dao.save(userDocument, callback);
            },
            function(callback) {
                pb.settings.set('active_theme',
                pb.RequestHandler.DEFAULT_THEME, callback);
            },
            function(callback) {
                //Do nothing here because it calls set under the covers.
                //We assume it does what it is supposed to.  Attempting to
                //set the settings again will only cause a failure due to a
                //duplicate key
                var contentService = new pb.ContentService();
                contentService.getSettings(callback);
            },
            function(callback) {
                pb.settings.set('system_initialized', true, callback);
            },
            function(callback) {
                pb.settings.set('call_home', callHome, callback);
            },
            function(callback) {
                if (callHome) {
                    CallHomeService.callHome(CallHomeService.SYSTEM_SETUP_EVENT);
                }
                callback(null, null);
            }
        ];
        async.series(tasks, function(err, results){
            if (util.isError(err)) {
                pb.log.error('An error occurred while attempting to perform setup: %s', err.stack || err.message);
                return self.formError(self.ls.g(ERROR_KEYS[results.length]), '/setup', cb);
            }

            self.session.success = self.ls.g('login.READY_TO_USE');
            self.redirect('/admin/login', cb);
        });
    };

    //exports
    return SetupActionController;
};
