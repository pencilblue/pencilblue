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
var async          = require('async');


module.exports = function(pb) {
    
    //pb dependencies
    var util = pb.util;
    var BaseController = pb.BaseController;
    var PluginService  = pb.PluginService;
    var RequestHandler = pb.RequestHandler;

    /**
     * Controller to properly route and handle remote calls to interact with
     * the PluginService
     * @class PluginApi
     * @constructor
     * @extends BaseController
     */
    function PluginApiController(){
        
        /**
         *
         * @property pluginService
         * @type {PluginService}
         */
    }
    util.inherits(PluginApiController, pb.BaseAdminController);

    //constants
    /**
     * The hash of actions that are available to execute for this controller. When
     * the key's value is TRUE, it indicates that a valid object ID must be part of
     * the request as a path variable "id".
     * @private
     * @static
     * @property VALID_ACTIONS
     * @type {Object}
     */
    var VALID_ACTIONS = {
        install: true,
        uninstall: true,
        reset_settings: true,
        initialize: true,
        set_theme: true
    };

    /**
     * Properly routes the incoming request to the handler after validation of the
     * properties
     * @method render
     * @param {Function} cb
     */
    PluginApiController.prototype.render = function(cb) {
        var action     = this.pathVars.action;
        var identifier = this.pathVars.id;
        this.pluginService = new pb.PluginService({site: this.site});

        //validate action
        var errors = [];
        if (!pb.validation.validateNonEmptyStr(action, true) || VALID_ACTIONS[action] === undefined) {
            errors.push(this.ls.get('VALID_ACTION_REQUIRED'));
        }

        //validate identifier
        if (VALID_ACTIONS[action] && !pb.validation.validateNonEmptyStr(identifier, true)) {
            errors.push(this.ls.get('VALID_IDENTIFIER_REQUIRED'));
        }

        //check for errors
        if (errors.length > 0) {
            var content = BaseController.apiResponse(BaseController.API_FAILURE, '', errors);
            cb({content: content, code: 400});
            return;
        }
        //route to handler
        this[action](identifier, cb);
    };

    /**
     * Triggers the installation of a plugin
     * @method install
     * @param {String} uid The unique id of the plugin to install
     * @param {Function} cb
     */
    PluginApiController.prototype.install = function(uid, cb) {
        var jobId   = this.pluginService.installPlugin(uid);
        var content = BaseController.apiResponse(BaseController.API_SUCCESS, '', jobId);
        cb({content: content});
    };

    /**
     * Triggers a plugin to uninstall from the cluster
     * @method uninstall
     * @param {String} uid The unique id of the plugin to uninstall
     * @param {Function} cb
     */
    PluginApiController.prototype.uninstall = function(uid, cb) {
        var self = this;

        var jobId   = this.pluginService.uninstallPlugin(uid);
        var content = BaseController.apiResponse(BaseController.API_SUCCESS, '', jobId);
        cb({content: content});
    };

    /**
     * Triggers the plugin's settings to be flushed and reloaded from the details.json file
     * @method reset_settings
     * @param {String} uid The unique id of the plugin to flush the settings for
     * @param {Function} cb
     */
    PluginApiController.prototype.reset_settings = function(uid, cb) {
        var self = this;

        var details = null;
        var tasks = [

            //load plugin
            function(callback) {
                self.pluginService.getPluginBySite(uid, function(err, plugin) {
                    if (!plugin) {
                        callback(new Error(util.format(self.ls.get('PLUGIN_NOT_FOUND'), uid)), false);
                        return;
                    }

                    var detailsFile = PluginService.getDetailsPath(plugin.dirName);
                    PluginService.loadDetailsFile(detailsFile, function(err, loadedDetails) {
                        if (util.isError(err)) {
                            callback(err, false);
                            return;
                        }

                        details = loadedDetails;
                        callback(null, true);
                    });
                });
            },

            //pass plugin to reset settings
            function(callback) {
                self.pluginService.resetSettings(details, callback);
            },

            //pass plugin to reset theme settings
            function(callback) {
                if (!details.theme || !details.theme.settings) {
                    callback(null, true);
                    return;
                }
                self.pluginService.resetThemeSettings(details, callback);
            }
        ];
        async.series(tasks, function(err, results) {
            if (util.isError(err)) {
                var data = [err.message];
                if (util.isArray(err.validationErrors)) {
                    for(var i = 0; i < err.validationErrors.length; i++) {
                        data.push(err.validationErrors[i].message);
                    }
                }
                var content = BaseController.apiResponse(BaseController.API_FAILURE, util.format(self.ls.get('RESET_SETTINGS_FAILED'), uid), data);
                cb({content: content, code: 400});
                return;
            }

            var content = BaseController.apiResponse(BaseController.API_SUCCESS, util.format(self.ls.get('RESET_SETTINGS_SUCCESS'), uid));
            cb({content: content});
        });
    };

    /**
     * Attempts to initialize a plugin
     * @method initialize
     * @param {String} uid The unique id of the plugin to initialize
     * @param {Function} cb
     */
    PluginApiController.prototype.initialize = function(uid, cb) {
        var self = this;

        this.pluginService.getPluginBySite(uid, function(err, plugin) {
            if (util.isError(err)) {
                var content = BaseController.apiResponse(BaseController.API_FAILURE, util.format(self.ls.get('INITIALIZATION_FAILED'), uid), [err.message]);
                cb({content: content, code: 500});
                return;
            }

            self.pluginService.initPlugin(plugin, function(err, results) {
                if (util.isError(err)) {
                    var content = BaseController.apiResponse(BaseController.API_FAILURE, util.format(self.ls.get('INITIALIZATION_FAILED'), uid), [err.message]);
                    cb({content: content, code: 400});
                    return;
                }

                var content = BaseController.apiResponse(BaseController.API_SUCCESS, util.format(self.ls.get('INITIALIZATION_SUCCESS'), uid));
                cb({content: content});
            });
        });
    };

    /**
     * Attempts to set the active theme
     * @method set_theme
     * @param {String} uid The unique id of the plugin to set as the active theme
     * @param {Function} cb
     */
    PluginApiController.prototype.set_theme = function(uid, cb) {
        var self = this;

        //retrieve plugin
        this.pluginService.getPluginBySite(uid, function(err, plugin) {
            if (uid !== RequestHandler.DEFAULT_THEME && util.isError(err)) {
                var content = BaseController.apiResponse(BaseController.API_FAILURE, util.format(self.ls.get('SET_THEME_FAILED'), uid), [err.message]);
                cb({content: content, code: 500});
                return;
            }

            //plugin wasn't found & has theme
            if (uid !== RequestHandler.DEFAULT_THEME && (!plugin || !util.isObject(plugin.theme))) {
                self.reqHandler.serve404();
                return;
            }

            var theme = plugin ? plugin.uid : uid;
            self.settings.set('active_theme', theme, function(err, result) {
                if (util.isError(err)) {
                    var content = BaseController.apiResponse(BaseController.API_FAILURE, util.format(self.ls.get('SET_THEME_FAILED'), uid), [err.message]);
                    cb({content: content, code: 500});
                    return;
                }

                var content = BaseController.apiResponse(BaseController.API_SUCCESS, util.format(self.ls.get('SET_THEME_SUCCESS'), uid));
                cb({content: content});
            });
        });
    };

    //exports
    return PluginApiController;
};
