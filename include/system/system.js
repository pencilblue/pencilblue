function System(){}

//dependencies
var os      = require('os');
var cluster = require('cluster');

//statics
var SHUTDOWN_HOOKS   = {};
var IS_SHUTTING_DOWN = false;

System.onStart(onChildRunning) {
    if (cluster.isMaster) {
        System.onMasterRunning();   
    }
    else {
        onChildRunning();   
    }
};

System.onMasterRunning = function() {
    
    var workerCnt = os.cpus().length;
    if (pb.config.cluster.workers && pb.config.cluster.workers !== 'auto') {
        workerCnt = pb.config.cluster.workers;   
    }
    
    //spawn workers
    for (var i = 0; i < workerCnt; i++) {
        cluster.fork();   
    }
    cluster.on('disconnect', System.onWorkerDisconntect);
};

System.onWorkerDisconntect = function(worker) {
    //TODO handle disconnect
};

System.getWorkerId = function() {
    return cluster.worker ? cluster.worker.id : 'M';  
};

System.registerShutdownHook = (name, shutdownHook) {
    if (!pb.validation.validateNonEmptyStr(name)) {
        throw new Error('A name must be provided for every shutdown hook');
    }
    SHUTDOWN_HOOKS[name] = shutdownHook;
};

System.shutdown = function(cb) {
    cb = cb || pb.utils.cb;
    
    var tasks = pb.utils.getTasks(Object.keys(SHUTDOWN_HOOKS), function(keys, i) {
        return function(callback) {
            
            var timeoutHandle = setTimeout(function() {
                timeoutHandle = null;
                //TODO log & make timeout configurable
                callback(null, false);
            }, 100);
            
            var d = domain.create();
            d.run(function() {
                SHUTDOWN_HOOKS[keys[i]](function(err, result) {
                    if (timeoutHandle) {
                        clearTimeout(timeoutHandle);   
                        timeoutHandle = null;
                        callback(null, result);
                    }
                });
            });
            d.on('error', function(err) {
                if (timeoutHandle) {
                    clearTimeout(timeoutHandle);
                    timeoutHandle = null;
                }
                //TODO log
                callback(null, false);
            });
        };
    });
    async.parallel(tasks, function(err, results) {
        //TODO log
        cb(err, results); 
    });
};

//register with OS
// listen for TERM signal .e.g. kill 
process.on ('SIGTERM', function() {
    log.debug('System[%s]: SIGTERM detected %s', System.getWorkerId(), IS_SHUTTING_DOWN ? 'but is already shutting down' : '');
    if (!IS_SHUTTING_DOWN) {
        System.shutdown();
    }
});

// listen for INT signal e.g. Ctrl-C
process.on ('SIGINT', function() {
    log.debug('System[%s]: SIGINT detected %s', System.getWorkerId(), IS_SHUTTING_DOWN ? 'but is already shutting down' : '');
    if (!IS_SHUTTING_DOWN) {
        System.shutdown();
    }
});

//exports
module.exports = System;
