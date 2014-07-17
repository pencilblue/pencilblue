
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

PluginUninstallJob.prototype.isInitiator = true;

PluginUninstallJob.prototype.setRunAsInitiator = function(isInitiator) {
    this.isInitiator = isInitiator;
};

PluginUninstallJob.prototype.getTasks() {
    //start here.
}

//inheritance
util.inherits(PluginUninstallJob, AsyncJobRunner);