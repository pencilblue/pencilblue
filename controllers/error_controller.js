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
    class ErrorViewController extends pb.BaseController {
        initSync (context) {
            this.error = context.error || this.error;
            this.status = this.error && this.error.code ? this.error.code : 500;
            this.contentSettingService = new pb.ContentService(this.getServiceContext());
            this.topMenuService = new pb.TopMenuService(this.getServiceContext());
            this.setPageName(this.status + '');
        }

        render (cb) {
            this._gatherData((err, data) => {
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
                        loggedIn: pb.security.isAuthenticated(this.session),
                        accountButtons: data.navItems.accountButtons
                    }
                );

                //register the model with the template service
                var errMsg = this.errorMessage;
                var errStack = this.error && pb.config.logging.showErrors ? this.error.stack : '';

                if(this.error && this.error.code < 500) {
                    errMsg = '';
                    errStack = '';
                }

                var model = {
                    navigation: new pb.TemplateValue(data.navItems.navigation, false),
                    account_buttons: new pb.TemplateValue(data.navItems.accountButtons, false),
                    angular_objects: new pb.TemplateValue(angularController, false),
                    status: this.status,
                    error_message: errMsg,
                    error_stack: errStack
                };
                this.ts.registerModel(model);

                //load template
                this.ts.load(this.templatePath, (err, content) => {
                    if (util.isError(err)) {

                        //to prevent loops we just bury the error
                        pb.log.error('ErrorController: %s', err.stack);
                    }

                    cb({
                        content: content,
                        code: this.status,
                        content_type: 'text/html'
                    });
                });
            });
        };

        get errorMessage () {
            return this.error ? this.error.message : this.ls.g('error.ERROR');
        };

        get templatePath () {
            return 'error/default';
        };

        _gatherData (cb) {
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
    }

    //exports
    return ErrorViewController;
};
