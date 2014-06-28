function AnalyticsManager(){}

//statics
var PROVIDER_HOOKS = {};

AnalyticsManager.prototype.gatherData = function(req, session, ls, cb) {
    var tasks = pb.utils.getTasks(Object.keys(PROVIDER_HOOKS), function(keys, i) {
        return function(callback) {
            if (pb.log.isSilly()) {
                pb.log.silly("AnalyticsManager: Rendering provider [%s] for URL [%s:%s]", keys[i], req.method, req.url);
            }
            
            var th = setTimeout(function() {
                if (pb.log.isSilly()) {
                    pb.log.silly("AnalyticsManager: Rendering for provider [%s] timed out", keys[i]);
                }
                
                ts = null;
                callback(null, '');
            }, 20);
            
            var d = domain.create();
            d.run(function() {
                PROVIDER_HOOKS[keys[i]](req, session, ls, function(err, result) {
                    if (util.isError(err)) {
                        pb.log.error("AnalyticsManager: Rendering provider [%s] failed for URL [%s:%s]\n%s", keys[i], req.method, req.url, err.stack);
                    }
                    
                    if (th) {
                        clearTimeout(th);
                        callback(null, result);
                    }
                });
            });
            d.on('error', function(err) {
                pb.log.error("AnalyticsManager: Rendering provider [%s] failed for URL [%s:%s]\n%s", keys[i], req.method, req.url, err.stack);
                if (th) {
                    clearTimeout(th);
                    callback(null, '');
                }
            });
        };
    });
    async.parallel(tasks, function(err, results) {
        cb(err, new pb.TemplateValue(results.join(''), false));
    });
};

AnalyticsManager.registerProvider = function(name, onPageRendering) {
    if (!pb.validation.validateNonEmptyStr(name) || AnalyticsManager.isRegistered(name) || !pb.utils.isFunction(onPageRendering)) {
        return false;
    }
    
    PROVIDER_HOOKS[name] = onPageRendering;
    return true;
};

AnalyticsManager.isRegistered = function(name) {
    return PROVIDER_HOOKS[name] !== undefined;  
};

AnalyticsManager.onPageRender = function(req, session, ls, cb) {
    var managerInstance = new AnalyticsManager();
    managerInstance.gatherData(req, session, ls, cb);
};

//exports
module.exports = AnalyticsManager;
