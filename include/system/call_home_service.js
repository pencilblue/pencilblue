/*
    Copyright (C) 2014  PencilBlue, LLC

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
var os = require('os');

function CallHomeService(){}

//constants
var HOST   = 'pencilblue.org';
var PORT   = 443;
var PATH   = '/api/v1/callhome/event';
var METHOD = 'POST';

//statics
CallHomeService.SYSTEM_SETUP_EVENT = 'system_setup';


CallHomeService.callHome = function(type, data) {
    if (!pb.utils.isObject(data)) {
        data = {};
    }

    data.type      = type;
    data.site_ip   = pb.config.siteIP;
    data.site_name = pb.config.siteName;
    data.os        = os.type();
    data.platform  = os.platform();
    data.release   = os.release();
    data.cpus      = os.cpus();
    data.version   = process.versions;
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
    CallHomeService._callHome(post_options, post_data);
};

CallHomeService._callHome = function(options, postData) {

    var d = domain.create();
    d.on('error', function(err) {
        pb.log.silly('CallHomeService: An error occurred attempting to send event. %s', err.stack);
    });
    d.run(function() {

        var post_req = https.request(options, function(res) {

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
        post_req.write(postData);
        post_req.end();
    });
};

CallHomeService.onResponseRecieved = function(res, json) {
    pb.log.silly('CallHomeService: Event Response: %s', json);
};

//exports
module.exports = CallHomeService;
