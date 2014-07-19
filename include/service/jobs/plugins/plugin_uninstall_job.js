
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
                pluginUid: self.pluginUid,
                jobId: self.getId()
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

    var tasks = [

        //test task
        function(callback) {
            self.log('Worker received command to uninstall!');
            callback(null, true);
        }
    ];
    cb(null, tasks);
};

//exports
module.exports = PluginUninstallJob;
