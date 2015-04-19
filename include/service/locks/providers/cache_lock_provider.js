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
var util = require('../../../util.js');

module.exports = function(pb) {
    
    /**
     * A lock provider that leverages the cache to create semaphores
     * @class CacheLockProvider
     * @constructor
     */
    function CacheLockProvider() {}
    
    /**
     * Attempts to acquire the lock with the given name.  
     * @method acquire
     * @param {String} name
     * @param {Object} [options={}]
     * @param {Object} [options.payload]
     * @param {Integer} [options.timeout]
     * @param {Function} cb
     */
    CacheLockProvider.prototype.acquire = function(name, options, cb) {
        if (util.isFunction(options)) {
            cb = options;
            options = {}
        }
        
        //try and acquire the lock
        pb.cache.setnx(name, JSON.stringify(options.payload), function(err, reply) {
            if (util.isError(err) || !reply) {
                return cb(err, false);   
            }
            
            //lock was created not ensure it will expire
            pb.cache.expire(name, options.timeout /*sec*/, function(err, result) {
                cb(err, result ? true : false);
            });
        });
    };
    
    /**
     * Retrieves the payload for the lock
     * @method get
     * @param {String} name
     * @param {Function} cb
     */
    CacheLockProvider.prototype.get = function(name, cb) {
        pb.cache.get(name, function(err, result) {
            if (result) {
                try{
                    result = JSON.parse(result);
                }
                catch(e) {
                    pb.log.silly('CacheLockProvider: Failed to parse lock payload. ', e.stack);
                }
            }
            cb(err, result);
        });
    };
    
    /**
     * Releases the lock
     * @method release
     * @param {String} name
     * @param {Object} [options={}]
     * @param {Function} cb
     */
    CacheLockProvider.prototype.release = function(name, options, cb) {
        if (util.isFunction(options)) {
            cb = options;
            options = {};
        }
        
        pb.cache.del(name, function(err, result) {
            cb(err, result ? true : false);
        });
    };
    
    return CacheLockProvider;
};