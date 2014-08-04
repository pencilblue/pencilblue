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

/**
 * Creates the cache
 *
 * @module Database
 * @class CacheFactory
 * @constructor
 */
function CacheFactory(){}

//statics
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

    CLIENT = CacheFactory.createInstance();
    return CLIENT;
};

/**
 *
 *
 *
 */
CacheFactory.createInstance = function() {
    var moduleAtPlay = pb.config.cache.fake ? "fakeredis" : "redis";
    var Redis        = require(moduleAtPlay);
    return Redis.createClient(pb.config.cache.port, pb.config.cache.host, pb.config.cache);
};

/**
 * Shuts down the Redis or FakeRedis instance
 *
 * @method shutdown
 * @param  {Function} cb Callback function
 */
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
