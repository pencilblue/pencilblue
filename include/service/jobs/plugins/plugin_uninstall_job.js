
//dependencies
var AsyncJobRunner = require('../async_job_runner.js');

/**
 *
 * @class PluginUninstallJob
 * @constructor
 */
function PluginUninstallJob(){
    this.init();
    this.setParallelLimit(1);
};

//inheritance
util.inherits(PluginUninstallJob, AsyncJobRunner);

//statics
PluginUninstallJob.UNINSTALL_PLUGIN_COMMAND = 'uninstall_plugin';

PluginUninstallJob.prototype.isInitiator = true;

PluginUninstallJob.prototype.pluginUid = '';

PluginUninstallJob.prototype.setRunAsInitiator = function(isInitiator) {
    this.isInitiator = isInitiator;
    return this;
};

PluginUninstallJob.prototype.setPluginUid = function(pluginUid) {
    this.pluginUid = pluginUid;
    return this;
};

PluginUninstallJob.prototype.getPluginUid = function() {
    return this.pluginUid;
};

PluginUninstallJob.prototype.getTasks = function(cb) {
    if (this.isInitiator) {
        this.getInitiatorTasks(cb);
    }
    else {
        this.getWorkerTasks(cb);
    }
}

PluginUninstallJob.prototype.getInitiatorTasks = function(cb) {
    var self = this;

    var tasks = [

        //uninstall command to all in cluster
        function(callback) {

            var command = {
                pluginUid: self.getPluginUid(),
                jobId: self.getId(),

                //we provide a progress function to update the job listing
                progress: function(indexOfExecutingTask, totalTasks) {

                    var increment = 100 / totalTasks;
                    self.onUpdate(increment);
                }
            };
            pb.CommandService.sendCommandToAllGetResponses(PluginUninstallJob.UNINSTALL_PLUGIN_COMMAND, command, function(err, results) {
                if (util.isError(err)) {
                    callback(err);
                    return;
                }

                //check for success or failure
                for (var i = 0; i < results.length; i++) {

                    if (results[i].error) {
                        callback(new Error('A failure occurred while performing the install on at least one of the processes.  Check the job log for more details.'));
                        return;
                    }
                }
                callback(null, true);
            });
        }
    ];
    cb(null, tasks);
};

PluginUninstallJob.prototype.getWorkerTasks = function(cb) {
    var self = this;

    var pluginUid = this.getPluginUid();
    var tasks = [

        //call onUninstall
        function(callback) {
            if (!pb.PluginService.isActivePlugin(pluginUid)) {
                self.log("[%s] Skipping call to plugin's onUninstall function.  Main module was not active.", pluginUid);
                callback(null, true);
                return;
            }

            var mm = pb.PluginService.getActiveMainModule(pluginUid);
            if (pb.utils.isFunction(mm.onUninstall)) {
                self.log('[%s] Calling plugin onUnstall', pluginUid);

                var d = domain.create();
                d.on('error', callback);
                d.run(function() {
                    mm.onUninstall(callback);
                });
            }
            else {
                self.log('[%s] Plugin onUninstall function does not exist.  Skipping.', pluginUid);
                callback(null, true);
            }
        },

        //unregister routes
        function(callback) {
            var routesRemoved = pb.RequestHandler.unregisterThemeRoutes(pluginUid);
            self.log('[%s] Unregistered %d routes', pluginUid, routesRemoved);
            process.nextTick(function(){callback(null, true);});
        },

        //remove localization
        function(callback) {
            //TODO refactor localization to figure out how to remove only those
            //that were overriden. For now any overriden localizations will be
            //left until the server cycles.  This is not ideal but will suffice
            //for most use cases.  The only affected use case is if a default
            //label is overriden.
            process.nextTick(function(){callback(null, true);});
        },

        //remove settings
        function(callback) {
            self.log('[%s] Attemping to remove plugin settings', pluginUid);

            pb.plugins.pluginSettingsService.purge(pluginUid, function (err, result) {
                callback(err, !util.isError(err) && result);
            });
        },

        //remove theme settings
        function(callback) {
            self.log('[%s] Attemping to remove theme settings', pluginUid);

            pb.plugins.themeSettingsService.purge(pluginUid, function (err, result) {
                callback(err, !util.isError(err) && result);
            });
        },

        //remove plugin record from "plugin" collection
        function(callback) {
            self.log('[%s] Attemping to remove plugin from persistent storage', pluginUid);

            var where = {
                uid: pluginUid
            };
            var dao = new pb.DAO();
            dao.deleteMatching(where, 'plugin').then(function(result) {

                var error = util.isError(result) ? result : null;
                callback(error, error == null);
            });
        },

        //roll over to default theme
        function(callback) {
            self.log('[%s] Inspecting the active theme', pluginUid);

            //retrieve the plugin so we can see if the value matches what we
            //are uninstalling
            pb.settings.get('active_theme', function(err, activeTheme) {
                if (util.isError(err)) {
                    callback(err, false);
                    return;
                }

                //check if we need to reset the active theme
                if (activeTheme === pluginUid) {
                    self.log('[%s] Uninstalling the active theme.  Switching to pencilblue');

                    pb.settings.set('active_theme', 'pencilblue', function(err, result) {
                        callback(err, result ? true : false);
                    });
                }
                else {
                    callback(null, true);
                }
            });
        },

        //remove from ACTIVE_PLUGINS//unregister services
        function(callback) {
            var result = pb.PluginService.deactivatePlugin(pluginUid);
            process.nextTick(function(){callback(null, result);});
        }
    ];
    cb(null, tasks);
};

PluginUninstallJob.prototype.processResults = function(err, results, cb) {
    if (util.isError(err)) {
        cb(err, results);
        return;
    }

    //create function to handle cleanup and cb
    var self = this;
    var finishUp = function(err, result) {

        //only set done if we were the process that organized this uninstall.
        if (self.isInitiator) {
            self.onCompleted(err);
        }
        cb(err, result);
    };

    if (this.isInitiator) {
        this.processClusterResults(err, results, cb);
    }
    else {
        this.processWorkerResults(err, results, cb);
    }
};

PluginUninstallJob.prototype.processClusterResults = function(err, results, cb) {
    if (util.isError(err)) {
        cb(err, results);
        return;
    }

    var firstErr = undefined;
    var success  = true;

    outside:
    for (var i = 0; i < results.length; i++) {
        if (!results[i]) {
            firstErr = 'An error occurred while attempting to uninstall ['+this.getPluginUid()+']';
            success = false;
            break;
        }
    }

    var result = {
        success: success,
        id: this.getId(),
        pluginUid: this.getPluginUid(),
        results: results
    };
    cb(err, result);
};

PluginUninstallJob.prototype.processWorkerResults = function(err, results, cb) {
    cb(err, results);
};

PluginUninstallJob.prototype.onBeforeFirstTask = function(cb) {
    if (this.isInitiator) {
        this.onStart();
    }
    cb(null, true);
};

//exports
module.exports = PluginUninstallJob;
