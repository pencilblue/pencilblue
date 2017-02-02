/*
    Copyright (C) 2016  PencilBlue, LLC

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
'use strict';

//dependencies
const _ = require('lodash');
const Configuration = require('../config');
const domain = require('domain');
const https = require('https');
const log = require('../utils/logging').newInstance('CallHomeService');
const os = require('os');

    /**
     *
     * @class CallHomeService
     * @constructor
     */
    class CallHomeService {

        /**
         *
         * @private
         * @static
         * @readonly
         * @property HOST
         * @type {String}
         */
        static get HOST() {
            return 'pencilblue.org';
        }

        /**
         * @readonly
         * @type {Integer}
         */
        static get PORT() {
            return 443;
        }

        /**
         * @readonly
         * @type {String}
         */
        static get PATH() {
            return '/api/v1/callhome/event';
        }

        /**
         * @readonly
         * @type {String}
         */
        static get METHOD() {
            return 'POST';
        }

        //statics
        /**
         * @readonly
         * @type {String}
         */
        static get SYSTEM_SETUP_EVENT() {
            return 'system_setup';
        }

        /**
         *
         * @static
         * @method callHome
         * @param {String} type
         * @param {Object} data
         */
        static callHome(type, data) {
            if (!_.isObject(data)) {
                data = {};
            }

            data.type = type;
            data.site_ip = Configuration.active.siteIP;
            data.site_name = Configuration.active.siteName;
            data.os = os.type();
            data.platform = os.platform();
            data.release = os.release();
            data.cpus = os.cpus();
            data.version = process.versions;
            var post_data = JSON.stringify(data);

            // An object of options to indicate where to post to
            var post_options = {
                host: CallHomeService.HOST,
                port: CallHomeService.PORT,
                path: CallHomeService.PATH,
                method: CallHomeService.METHOD,
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': post_data.length
                }
            };

            // Set up the request
            log.debug('CallHomeService: Sending event [%s] to [%s:%s%s', type, CallHomeService.METHOD, HOST, PATH);
            _callHome(post_options, post_data);
        }
    }

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
            log.silly('CallHomeService: An error occurred attempting to send event. %s', err.stack);
        });
        d.run(getDomainRunner(options, postData));
    }

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
    }

    /**
     *
     * @private
     * @param {Response} res
     * @param {string} json
     */
    function onResponseRecieved(res, json) {
        log.silly('CallHomeService: Event Response: %s', json);
    }

    //exports
    module.exports = CallHomeService;
