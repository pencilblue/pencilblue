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
var util = require('../util.js');

module.exports = function CacheModule(pb){

    /**
     * Creates the cache
     *
     * @module dao
     * @class CacheFactory
     * @constructor
     */
    var CacheFactory = function(){};

    /**
     *
     * @private
     * @static
     * @property CLIENT
     * @type {RedisClient}
     */
    var CLIENT = null;

    /**
     * Retrieves the instance of Redis or FakeRedis
     *
     * @method getInstance
     * @return {Object} client
     */
    CacheFactory.getInstance = function() {
        if (CLIENT !== null) {
            return CLIENT;
        }

        //create instance
        CLIENT = CacheFactory.createInstance();

        //register for shutdown so we can clean up after ourselves
        pb.system.registerShutdownHook('CacheFactory', CacheFactory.shutdown);
        return CLIENT;
    };

    /**
     *
     * @method createInstance
     * @param {Object} [config] The Redis configuration.  When not provided the
     * configuration for this instance of PencilBlue is used.
     * return {RedisClient}
     */
    CacheFactory.createInstance = function(config) {
        if (!util.isObject(config)) {
            config = pb.config.cache;
        }

        var moduleAtPlay = config.fake ? "fakeredis" : "redis";
        var Redis        = require(moduleAtPlay);
        return Redis.createClient(config.port, config.host, config);
    };

    /**
     * Shuts down the Redis or FakeRedis instance
     *
     * @method shutdown
     * @param  {Function} cb Callback function
     */
    CacheFactory.shutdown = function(cb) {
        cb = cb || utils.cb;

        if (CLIENT !== null) {
            try {
                CLIENT.quit();
            }
            catch(err) {
                return cb(err);
            }
        }
        cb();
    };

    //return inner export
    return {
        CacheFactory: CacheFactory
    };
};
