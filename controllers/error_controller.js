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
'use strict';

//dependencies
var _ = require('lodash');
var async = require('async');
var BaseController = require('./base_controller');
var ClientJs = require('../include/client_js');
var Configuration = require('../include/config');
var ContentService = require('../include/content');
var HttpStatusCodes = require('http-status-codes');
var SecurityService = require('../include/access_management');
var TemplateValue = require('../include/service/entities/template_service').TemplateValue;
var TopMenuService = require('../include/theme/top_menu');
var log = require('../include/utils/logging').newInstance('ErrorController');

/**
 * Default Error Controller for HTML
 * @class ErrorViewController
 * @constructor
 * @extends BaseController
 */
class ErrorViewController extends BaseController {
    constructor() {
        super();
    }

    /**
     * Initializes the controller
     * @param {Object} context
     */
    initSync(context) {

        /**
         *
         * @property error
         * @type {Error}
         */
        this.error = context.error || this.error;

        /**
         *
         * @property status
         * @type {Integer}
         */
        this.status = this.error && this.error.code ? this.error.code : HttpStatusCodes.INTERNAL_SERVER_ERROR;

        /**
         *
         * @property contentSettingService
         * @type {ContentService}
         */
        this.contentSettingService = new ContentService(this.getServiceContext());

        /**
         *
         * @property contentSettingService
         * @type {TopMenuService}
         */
        this.topMenuService = new TopMenuService(this.getServiceContext());

        //set the default page name based on the status code if provided
        this.setPageName(this.status + '');
    }

    /**
     *
     * @method render
     * @param {Function} cb
     */
    render(cb) {
        var self = this;


        this.gatherData(function (err, data) {
            if (_.isError(err)) {

                //to prevent loops we just bury the error
                log.error('ErrorController: %s', err.stack);
                data = {
                    navItems: {}
                };
            }

            //build angular controller
            var angularController = ClientJs.getAngularController(
                {
                    navigation: data.navItems.navigation,
                    contentSettings: data.contentSettings,
                    loggedIn: SecurityService.isAuthenticated(self.session),
                    accountButtons: data.navItems.accountButtons
                }
            );

            //register the model with the template service
            var errMsg = self.getErrorMessage();
            var errStack = self.error && Configuration.active.logging.showErrors ? self.error.stack : '';
            var model = {
                navigation: new TemplateValue(data.navItems.navigation, false),
                account_buttons: new TemplateValue(data.navItems.accountButtons, false),
                angular_objects: new TemplateValue(angularController, false),
                status: self.status,
                error_message: errMsg,
                error_stack: errStack
            };
            self.ts.registerModel(model);

            //load template
            self.ts.load(self.getTemplatePath(), function (err, content) {
                if (_.isError(err)) {

                    //to prevent loops we just bury the error
                    log.error('ErrorController: %s', err.stack);
                }

                cb({
                    content: content,
                    code: self.status,
                    content_type: 'text/html'
                });
            });
        });
    }

    /**
     * @method getErrorMessage
     * @return {String}
     */
    getErrorMessage() {
        return this.error ? this.error.message : this.ls.g('error.ERROR');
    }

    /**
     *
     * @method getTemplatePath
     * @return {String}
     */
    getTemplatePath() {
        return 'error/default';
    }

    /**
     * @method gatherData
     * @param {Function} cb
     */
    gatherData(cb) {
        var self = this;

        var tasks = {
            contentSettings: function (callback) {
                self.contentSettingService.getSettings(callback);
            },

            navItems: function (callback) {
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
    }
}

//exports
module.exports = ErrorViewController;
