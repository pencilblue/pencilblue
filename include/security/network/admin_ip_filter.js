var async = require('async');
var util = require('../../util.js');

module.exports = function AdminIPFilterModule(pb) {

    var FILTERS = [];

    function AdminIPFilter() {}


    AdminIPFilter.addFilter = function (filter) {
        FILTERS.push(filter);
    };

    AdminIPFilter.requestIsAuthorized = function(req, cb) {
        if(FILTERS.length < 1) {
            return cb(null, true);
        }
        var ip = req.connection.remoteAddress;
        var ipList = [];
        if (req && req.headers && req.headers["x-forwarded-for"]) {
            var xForwardedForIps = req.headers["x-forwarded-for"].split(/[\s,]+/);
            ipList = ipList.concat(xForwardedForIps);
        }

        if(ipList.length > 0) {
            ip = ipList[0];
        }

        var tasks = util.getTasks(FILTERS, function(filters, i) {
            return function(callback) {
                filters[i].isIPAuthorized(ip, callback);
            };
        });

        async.parallel(tasks, function(err, results) {
            if(util.isError(err)) {
                pb.log.error("AdminIPFilter: %s", err.message);
                return cb(err);
            }

            cb(null, results.indexOf(true) > -1);
        });
    };
    return AdminIPFilter;
};
