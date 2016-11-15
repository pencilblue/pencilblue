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
var fs         = require('fs');
var formidable = require('formidable');
var async      = require('async');

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
    function PluginApiController(){}
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
        clone: false,
        delete: true,
        install: true,
        uninstall: true,
        reset_settings: true,
        initialize: true,
        set_theme: true,
        upload: false
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
        if (!pb.validation.isNonEmptyStr(action, true) || VALID_ACTIONS[action] === undefined) {
            errors.push(this.ls.g('generic.VALID_ACTION_REQUIRED'));
        }

        //validate identifier
        if (VALID_ACTIONS[action] && !pb.validation.isNonEmptyStr(identifier, true)) {
            errors.push(this.ls.g('generic.VALID_IDENTIFIER_REQUIRED'));
        }

        //check for errors
        if (errors.length > 0) {
            var content = BaseController.apiResponse(BaseController.API_FAILURE, '', errors);
            cb({content: content, code: 400});
            return;
        }
        //route to handler
        if (identifier) {
            this[action](identifier, cb);
        } else {
            this[action](cb);
        }
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
                        callback(new Error(util.format(self.ls.g('generic.PLUGIN_NOT_FOUND'), uid)), false);
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
                var content = BaseController.apiResponse(BaseController.API_FAILURE, util.format(self.ls.g('generic.RESET_SETTINGS_FAILED'), uid), data);
                return cb({content: content, code: 400});
            }

            var json = BaseController.apiResponse(BaseController.API_SUCCESS, util.format(self.ls.g('generic.RESET_SETTINGS_SUCCESS'), uid));
            cb({content: json});
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
                var content = BaseController.apiResponse(BaseController.API_FAILURE, util.format(self.ls.g('generic.INITIALIZATION_FAILED'), uid), [err.message]);
                cb({content: content, code: 500});
                return;
            }

            self.pluginService.initPlugin(plugin, function(err, results) {
                var content = util.isError(err) ? BaseController.apiResponse(BaseController.API_FAILURE, util.format(self.ls.g('generic.INITIALIZATION_FAILED'), uid), [err.message]) :
                    BaseController.apiResponse(BaseController.API_SUCCESS, util.format(self.ls.g('generic.INITIALIZATION_SUCCESS'), uid));

                cb({
                    content: content,
                    code: util.isError(err) ? 400 : 200
                });
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
                var content = BaseController.apiResponse(BaseController.API_FAILURE, util.format(self.ls.g('generic.SET_THEME_FAILED'), uid), [err.message]);
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
                var content = util.isError(err) ? BaseController.apiResponse(BaseController.API_FAILURE, util.format(self.ls.g('generic.SET_THEME_FAILED'), uid), [err.message]) :
                    BaseController.apiResponse(BaseController.API_SUCCESS, util.format(self.ls.g('generic.SET_THEME_SUCCESS'), uid));


                return cb({
                    content: content,
                    code: util.isError(err) ? 500 : 200
                });
            });
        });
    };
    
    /**
     * Clones a git repository
     * @method clone
     * @param {Function} cb
     */
    PluginApiController.prototype.clone = function(cb) {
        var self = this;

        this.getJSONPostParams(function(err, post) {

            var message = self.hasRequiredParams(post, ['url']);
            if (message) {
                return cb({
                    code: 401,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, message)
                });
            }
            
            if (post.private && (!post.username || !post.password)) {
                return cb({
                    code: 401,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, 'Missing authentication')
                });
            }

            self.pluginService.cloneFromRepository(post, function (err) {
                if (util.isError(err)) {
                    // Probably an auth issue
                    if (err.message && err.message.indexOf('401') > -1) {
                        err.message = 'Unable to clone the repository. Try again using authentication';
                    }
                    return cb({content: BaseController.apiResponse(BaseController.API_FAILURE, err.message), code: 500});
                }
                return cb({content: BaseController.apiResponse(BaseController.API_SUCCESS, 'Successfully cloned: ' + post.url), code: 200});
            });
        });
    };
    
    /**
     * Deletes a plugin
     * @method delete
     * @param {String} uid The unique id of the plugin to be deleted
     * @param {Function} cb
     */
    PluginApiController.prototype.delete = function(uid, cb) {
        var self = this;
        this.pluginService.purgePlugin(uid, function(err) {
            if (util.isError(err)) {
                return cb({content: BaseController.apiResponse(BaseController.API_FAILURE, util.format(self.ls.g('generic.ERROR_DELETING'), uid), [err.message]), code: 500});
            }
            return cb({content: BaseController.apiResponse(BaseController.API_SUCCESS, self.ls.g('generic.SUCCESS')), code: 200});
        });
    };
    
    /**
     * Allows the user to upload an archive containing a plugin to the site
     * @method upload
     * @param {Function} cb
     */
    PluginApiController.prototype.upload = function(cb) {
       var self  = this;

        //set the limits on the file size
        var form = new formidable.IncomingForm();
        form.maxFieldSize = pb.config.plugins.max_archive_size;
        form.on('progress', function(bytesReceived, bytesExpected) {
            if (bytesReceived > pb.config.plugins.max_archive_size || bytesExpected > pb.config.plugins.max_archive_size) {
                if (!self.errored) {
                    this.emit('error', new Error(self.ls.g('media.FILE_TOO_BIG')));
                }
                self.errored++;
            }
        });

        //parse the form out and let us know when its done
        form.parse(this.req, function(err, fields, files) {
            if (util.isError(err)) {
                return self.onDone(err, null, files, cb);
            }

            var keys = Object.keys(files);
            if (keys.length === 0) {
                return self.onDone(new Error('No archive was submitted'), null, files, cb);
            }
            var archive = files[keys[0]];

            if (archive.name.indexOf('.zip') === -1) {
                return self.onDone(new Error('Invalid file type'), null, files, cb);
            }
            self.pluginService.unzipPlugin(archive, function(err, result) {
                if (util.isError(err)) {
                    return self.onDone(err, null, files, cb);
                }

                //write the response
                var content = {
                    code: 200,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS),
                    content_type: 'application/json'
                };
                self.onDone(null, content, files, cb);
            });
        });
    };
        
    /**
    * Handles the cleanup after the incoming form data has been processed.  It
    * attempts to remove uploaded files or file partials after a failure or
    * completion.
    * @method onDone
    * @param {Error} err
    * @param {Object} content
    * @param {Object} [files={}]
    * @param {Function} cb
    */
    PluginApiController.prototype.onDone = function(err, content, files, cb) {
        if (util.isFunction(files)) {
            cb = files;
            files = null;
        }
        if (!util.isObject(files)) {
            files = {};
        }

        //ensure all files are removed
        var self = this;
        var tasks = util.getTasks(Object.keys(files), function(fileFields, i) {
            return function(callback) {
                var fileDescriptor = files[fileFields[i]];

                //ensure file has a path to delete
                if (!fileDescriptor.path) {
                    return callback();
                }

                //remove the file
                fs.unlink(fileDescriptor.path, function(err) {
                    pb.log.info('Removed temporary file: %s', fileDescriptor.path);
                    callback();
                });
            };
        });
        async.parallel(tasks, function(error, results) {

            //weird case where formidable continues to process content even after
            //we cancel the stream with a 413.  This is a check to make sure we
            //don't call back again
            if (self.errored > 1) {
                return;
            }

            //we only care about the passed in error
            if (util.isError(err)) {
                var code = err.message === self.ls.g('media.FILE_TOO_BIG') ? 413 : 500;
                return cb({content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, err.message), code: code});
            }
            cb(content);
        });
    };

    //exports
    return PluginApiController;
};
