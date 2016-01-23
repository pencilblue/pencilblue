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

//dependencies
var async = require('async');

module.exports = function(pb) {

    //pb dependencies
    var util = pb.util;

    /**
     * Default Error Controller for HTML
     * @class ErrorViewController
     * @constructor
     * @extends BaseController
     */
    function ErrorViewController(){}
    util.inherits(ErrorViewController, pb.BaseController);

    /**
     * Initializes the controller
     * @method init
     * @param {Object} context
     * @param {Function} cb
     */
    ErrorViewController.prototype.init = function(context, cb) {
        var self = this;
        var init = function(err, result) {

            /**
             *
             * @property error
             * @type {Error}
             */
            self.error = context.error;

            /**
             *
             * @property status
             * @type {Integer}
             */
            self.status = self.error && self.error.code ? self.error.code : 500;

            /**
             *
             * @property contentSettingService
             * @type {ContentService}
             */
            self.contentSettingService = new pb.ContentService(self.getServiceContext());

            /**
             *
             * @property contentSettingService
             * @type {TopMenuService}
             */
            self.topMenuService = new pb.TopMenuService(self.getServiceContext());

            //set the default page name based on the status code if provided
            self.setPageName(self.status + '');

            //carry on
            cb(err, result);
        };
        ErrorViewController.super_.prototype.init.apply(this, [context, init]);
    };

    /**
     *
     * @method render
     * @param {Function} cb
     */
    ErrorViewController.prototype.render = function(cb) {
        var self = this;


        this.gatherData(function(err, data) {
            if (util.isError(err)) {

                //to prevent loops we just bury the error
                pb.log.error('ErrorController: %s', err.stack);
                data = {
                    navItems: {}
                };
            }

            //build angular controller
            var angularController = pb.ClientJs.getAngularController(
                {
                    navigation: data.navItems.navigation,
                    contentSettings: data.contentSettings,
                    loggedIn: pb.security.isAuthenticated(self.session),
                    accountButtons: data.navItems.accountButtons
                }
            );

            //register the model with the template service
            var errMsg = self.getErrorMessage();
            var errStack = self.error && pb.config.logging.showErrors ? self.error.stack : '';
            var model = {
                navigation: new pb.TemplateValue(data.navItems.navigation, false),
                account_buttons: new pb.TemplateValue(data.navItems.accountButtons, false),
                angular_objects: new pb.TemplateValue(angularController, false),
                status: self.status,
                error_message: errMsg,
                error_stack: errStack
            };
            self.ts.registerModel(model);

            //load template
            self.ts.load(self.getTemplatePath(), function(err, content) {
                if (util.isError(err)) {

                    //to prevent loops we just bury the error
                    pb.log.error('ErrorController: %s', err.stack);
                }

                cb({
                    content: content,
                    code: self.status,
                    content_type: 'text/html'
                });
            });
        });
    };

    /**
     * @method getErrorMessage
     * @return {String}
     */
    ErrorViewController.prototype.getErrorMessage = function() {
        return this.error ? this.error.message : this.ls.g('error.ERROR');
    };

    /**
     *
     * @method getTemplatePath
     * @return {String}
     */
    ErrorViewController.prototype.getTemplatePath = function() {
        return 'error/default';
    };

    /**
     * @method gatherData
     * @param {Function} cb
     */
    ErrorViewController.prototype.gatherData = function(cb) {
        var self = this;

        var tasks = {
            contentSettings: function(callback) {
                self.contentSettingService.getSettings(callback);
            },

            navItems: function(callback) {
                var options = {
                    ls: self.ls,
                    activeTheme: self.activeTheme,
                    session: self.session,
                    currUrl: self.req.url
                };
                self.topMenuService.getNavItems(options, callback);
            }
        };
        async.parallel(tasks, cb);
    };

    //exports
    return ErrorViewController;
};
