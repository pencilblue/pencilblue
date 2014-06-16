/**
 * @class CallHomeService
 * @constructor
 * @author Brian Hyder <brian@penciblue.org>
 * @copyright 2014 PencilBlue, LLC. All Rights Reserved
 */
function CallHomeService(){}

//constants
var HOST   = 'pencilblue.org'
var PORT   = 80;
var PATH   = '/api/v1/callhome/event';
var METHOD = 'POST';

//statics
CallHomeService.SYSTEM_SETUP_EVENT = 'system_setup';


CallHomeService.callHome = function(type, data) {
    if (!pb.utils.isObject(data)) {
        data = {};
    }
    
    data.type      = type;
    data.site_ip   = pb.config.siteIp;
    data.site_name = pb.config.siteName;
    var post_data  = JSON.stringify(data);
    
    // An object of options to indicate where to post to
    var post_options = {
        host: HOST,
        port: PORT,
        path: PATH,
        method: METHOD,
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': post_data.length
        }
    };

    // Set up the request
    pb.log.debug('CallHomeService: Sending event [%s] to [%s:%s%s', type, METHOD, HOST, PATH);
    var post_req = http.request(post_options, function(res) {
        
        var json = '';
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            json += chunk;
        });
        res.on('end', function() {
            CallHomeService.onResponseRecieved(res, json);
        });
    });
    
    // post the data
    post_req.write(post_data);
    post_req.end();
};

CallHomeService.onResponseRecieved = function(res, json) {
    pb.log.debug('CallHomeService: Event Response: %s', json);
};

//exports
module.exports = CallHomeService;
