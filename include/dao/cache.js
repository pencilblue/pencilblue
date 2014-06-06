/**
 * 
 * @author Brian Hyder <brianhyder@gmail.com>
 * @copyright PencilBlue 2014, All Rights Reserved
 */
function CacheFactory(){}

//statics
var CLIENT = null;

CacheFactory.getInstance = function() {
    if (CLIENT !== null) {
        return CLIENT;
    }
    
    var moduleAtPlay = pb.config.cache.fake ? "fakeredis" : "redis";
    var Redis        = require(moduleAtPlay);
    CLIENT           = Redis.createClient(pb.config.cache.port, pb.config.cache.host, pb.config.cache);
    return CLIENT;
};

CacheFactory.shutdown = function(cb) {
    cb = cb || pb.utils.cb;
    
    if (CLIENT !== null) {
        CLIENT.quit();   
    }
    cb(null, null);
};

//register for shutdown
pb.system.registerShutdownHook('CacheFactory', CacheFactory.shutdown);

//exports
module.exports = CacheFactory;
