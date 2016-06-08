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

//dependecies
var util  = require('util');
var async = require('async');
var http  = require('http');
var https = require('https');
var fs    = require('fs');

/**
 * Creates and initializes the HTTP server
 * @class ServerInitializer
 * @constructor
 * @param {Object} [pb] The PB object
 */
function ServerInitializer(/*pb*/) {}

/**
 * Initializes the server.  Depending on the configuration will start an HTTP
 * server and/or an HTTPs server.
 * @method init
 * @param {Object} context
 * @param {Logger} context.log
 * @param {Object} context.config The PB config object
 * @param {Function} context.onRequest Takes 2 parameters: req, res
 * @param {Function} [context.onHandOffRequest] Takes 2 parameters: req, res.  It is required if starting with SSL enabled
 * @param {Function} cb
 */
ServerInitializer.prototype.init = function(context, cb) {
    try{
        this._init(context, cb);
    }
    catch(e) {
        cb(e, null);
    }
};

/**
 * @private
 * @method _init
 * @param {Object} context
 * @param {Logger} context.log
 * @param {Object} context.config The PB config object
 * @param {Function} context.onRequest Takes 2 parameters: req, res
 * @param {Function} [context.onHandOffRequest] Takes 2 parameters: req, res.  It is required if starting with SSL enabled
 * @param {Function} cb
 */
ServerInitializer.prototype._init = function(context, cb) {
    var initializer = context.config.server.ssl.enabled ? this.initHttps : this.initHttp;
    initializer.apply(this, [context, cb]);
};

/**
 * @method initHttp
 * @param {Object} context
 * @param {Logger} context.log
 * @param {Object} context.config The PB config object
 * @param {Function} context.onRequest Takes 2 parameters: req, res
 * @param {Function} cb
 */
ServerInitializer.prototype.initHttp = function(context, cb) {
    context.log.info('ServerInitializer: HTTP server starting, binding on IP %s and port: %d', context.config.siteIP, context.config.sitePort);
    var server = this.getServer(context);
    this.startServer(server, context.config.sitePort, context.config.siteIP, function(err/*, started*/){
        cb(err, {
            server: server
        });
    });
};

/**
 * @method initHttps
 * @param {Object} context
 * @param {Logger} context.log
 * @param {Object} context.config The PB config object
 * @param {Function} context.onRequest Takes 2 parameters: req, res
 * @param {Function} context.onHandOffRequest Takes 2 parameters: req, res
 * @param {Function} cb
 */
ServerInitializer.prototype.initHttps = function(context, cb) {
    var log = context.log;
    var config = context.config;

    //create the server with options & callback
    var server = this.getSslServer(context);

    //create an http server that redirects to SSL site
    var handOffServer = this.getServer({ config: context.config, onRequest: context.onHandOffRequest});

    var self = this;
    var tasks = [

        //start primary HTTPS server
        function (callback) {
            log.info('ServerInitializer: HTTPS server starting, binding on IP %s and port: %d', config.siteIP, config.sitePort);
            self.startServer(server, config.sitePort, config.siteIP, callback);
        },

        //start handoff server that will force redirect back to HTTPs
        function (callback) {
            log.info('ServerInitializer: Handoff HTTP server starting, binding on IP %s and port: %d', config.server.ssl.handoff_ip, config.server.ssl.handoff_port);
            self.startServer(handOffServer, config.server.ssl.handoff_port, config.server.ssl.handoff_ip, callback);
        },
    ];
    async.series(tasks, function(err){
        cb(err, {
            server: server,
            handOffServer: handOffServer
        });
    });
};

/**
 * @method getServer
 * @param {Object} context
 * @param {Function} context.onRequest Takes 2 parameters: req, res
 * return {HttpServer}
 */
ServerInitializer.prototype.getServer = function(context) {
    return http.createServer(context.onRequest);
};

/**
 * @method getSslServer
 * @param {Object} context
 * @param {Object} context.config The PB config object
 * @param {Object} context.onRequest Takes 2 parameters: req, res
 * @return {HttpsServer}
 */
ServerInitializer.prototype.getSslServer = function(context) {
    var options = this.getSslServerOptions(context.config);
    return https.createServer(options, context.onRequest);
};

/**
 * @method getSslServerOptions
 * @param {Object} config
 * @param {Object} config.server
 * @param {Object} config.server.ssl
 * @param {String} config.server.ssl.key
 * @param {String} config.server.ssl.cert
 * @param {String} config.server.ssl.chain
 * @return {Object}
 */
ServerInitializer.prototype.getSslServerOptions = function(config) {
    var options = {
        key: fs.readFileSync(config.server.ssl.key),
        cert: fs.readFileSync(config.server.ssl.cert),
    };

    //the certificate authority or "chain" is optional.  Needed for
    //self-signed certs
    var chainPath = config.server.ssl.chain;
    if (util.isString(chainPath)) {
        options.ca = fs.readFileSync(chainPath);
    }
    return options;
};

/**
 * Does a simple start on a server object by binding to the specified IP address and port.
 * @method startServer
 * @param {HttpServer|HttpsServer} server
 * @param {Integer} port
 * @param {String} ip
 * @param {Function} cb
 */
ServerInitializer.prototype.startServer = function(server, port, ip, cb) {
    server.once('error', cb);
    server.listen(port, ip, function() {
        server.removeListener('error', cb);
        cb(null, true);
    });
};

module.exports = ServerInitializer;
