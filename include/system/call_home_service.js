/*
    Copyright (C) 2015  PencilBlue, LLC

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
var os      = require('os');
var https   = require('https');
var process = require('process');
var domain  = require('domain');
var util    = require('../util.js');

module.exports = function CallHomeServiceModule(pb) {

    /**
     *
     * @class CallHomeService
     * @constructor
     */
    function CallHomeService(){}

    /**
     *
     * @private
     * @static
     * @readonly
     * @property HOST
     * @type {String}
     */
    var HOST = 'pencilblue.org';

    /**
     *
     * @private
     * @static
     * @readonly
     * @property PORT
     * @type {Integer}
     */
    var PORT = 443;

    /**
     *
     * @private
     * @static
     * @readonly
     * @property PATH
     * @type {String}
     */
    var PATH = '/api/v1/callhome/event';

    /**
     *
     * @private
     * @static
     * @readonly
     * @property METHOD
     * @type {String}
     */
    var METHOD = 'POST';

    //statics
    /**
     *
     * @static
     * @readonly
     * @property SYSTEM_SETUP_EVENT
     * @type {String}
     */
    CallHomeService.SYSTEM_SETUP_EVENT = 'system_setup';

    /**
     *
     * @static
     * @method callHome
     * @param {String} type
     * @param {Object} data
     */
    CallHomeService.callHome = function(type, data) {
        if (!util.isObject(data)) {
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
        _callHome(post_options, post_data);
    };

    /**
     *
     * @private
     * @static
     * @method _callHome
     * @param {Object} options
     * @param {Object} postData
     */
    function _callHome(options, postData) {

        var d = domain.create();
        d.on('error', function(err) {
            pb.log.silly('CallHomeService: An error occurred attempting to send event. %s', err.stack);
        });
        d.run(getDomainRunner(options, postData));
    };
    
    /**
     *
     * @private
     * @static
     * @method getDomainRunner
     * @param {Object} options
     * @param {Object} postData
     */
    function getDomainRunner(options, postData) {
        return function() {
            var post_req = https.request(options, function(res) {

                var json = '';
                res.setEncoding('utf8');
                res.on('data', function (chunk) {
                    json += chunk;
                });
                res.on('end', function() {
                    onResponseRecieved(res, json);
                });
            });

            // post the data
            post_req.write(postData);
            post_req.end();
        };
    };

    /**
     *
     * @private
     * @static
     * @method onResponseRecieved
     * @param {Object} options
     * @param {Object} postData
     */
    function onResponseRecieved(res, json) {
        pb.log.silly('CallHomeService: Event Response: %s', json);
    };

    //exports
    return CallHomeService;
};
