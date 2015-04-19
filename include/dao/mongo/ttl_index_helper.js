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
var util  = require('../../util.js');
var async = require('async');

module.exports = function(pb) {
    
    /**
     *
     * Used to change the TTL index on a collection without elevated permissions
     * @class TTLIndexHelper
     * @constructor
     */
    function TTLIndexHelper() {
    
        /**
         *
         * @property lockService
         * @type {LockService}
         */
        this.lockService = new pb.LockService();
    }
    
    /**
     *
     * @private
     * @static
     * @readonly
     * @property INDEX_MOD_KEY_PREFIX
     * @type {String}
     */
    var INDEX_MOD_KEY_PREFIX = 'TTL_INDEX_MOD_LOCK_';
    
    /**
     * 
     * @method ensureIndex
     * @param {Object} procedure
     * @param {Function} cb
     */
    TTLIndexHelper.prototype.ensureIndex = function(procedure, cb) {
        var self = this;
        
        var collection = procedure.collection;
        var expiry = procedure.options.expireAfterSeconds;
        
        //ensure an index exists.  According to the MongoDB documentation ensure
        //index cannot modify a TTL value once it is created.  Therefore, we have
        //to ensure that the index exists and then send the collection modification
        //command to change the TTL value.
        var indexName = null;
        var acquiredLock = false;
        var key = INDEX_MOD_KEY_PREFIX + collection;
        var dao = new pb.DAO();
        var tasks = [
            
            //ensure the index is there
            function(callback) {
                dao.ensureIndex(procedure, callback);
            },
            
            //check to see if the index has the correct expiry
            function(index, callback) {
                indexName = index;
                self.hasCorrectTTLIndex(collection, index, expiry, callback);
            },
            
            //acquire lock when index does not match otherwise pass null to indicate we are done
            function(hasCorrectExpiry, callback) {
                if (hasCorrectExpiry) {
                    return callback(null, null);
                }
            
                pb.log.silly('TTLIndexHelper:[%s:%s] An incorrect TTL index was detected.  Attempting to acquire lock to modify it.', collection, indexName);
                self.lockService.acquire(key, callback);
            },
            
            //drop index when lock is acquired.  If NULL, the expiry is fine.  
            //If false assume that another process is handling it.
            function(acquiredLock, callback) {
                if (acquiredLock === null) {
                    return callback(null, null);
                }
                else if (acquiredLock === false) {
                    pb.log.silly('TTLIndexHelper:[%s:%s] Failed to acquire index mod lock.  Assuming another PB instance is handling it', collection, indexName);
                    return callback(null, null);
                }
                
                pb.log.silly('TTLIndexHelper:[%s:%s] Lock acquired, dropping the index before recreating it', collection, indexName);
                acquiredLock = true;
                dao.dropIndex(collection, indexName, callback);
            },
            
            //re-create the index when the result is not null
            function(dropResult, callback) {
                if (dropResult === null) {
                    return callback(null, true);
                }
                
                pb.log.silly('TTLIndexHelper:[%s:%s] Rebuilding TTL index', collection, indexName);
                dao.ensureIndex(procedure, callback);
            },
            
            //drop the lock
            function(indexName, callback) {
                if (!acquiredLock) {
                    return callback(null, indexName);
                }
                
                pb.log.silly('TTLIndexHelper:[%s:%s] Dropping index modification lock', collection, indexName);
                self.lockService.release(key, function(err, result) {
                    callback(err, indexName);
                });
            },
        ];
        async.waterfall(tasks, function(err, result) {
            pb.log.silly('TTLIndexHelper: Attempted to ensure the TTL index for collection %s. RESULT=[%s] ERROR=[%s]', collection, result, err ? err.message : 'NONE');
            cb(err, !util.isNullOrUndefined(result));
        });
    };
    
    /**
     * Retrieves and compares the expiry of a TTL index on the specified 
     * collection to the expiry provided.  Calls back with TRUE if and only if 
     * the index is found the expiries match.
     * @method hasCorrectTTLIndex
     * @param {String} collection
     * @param {String} indexName
     * @param {Integer} expectedExpiry 
     * @param {Function} cb
     */
    TTLIndexHelper.prototype.hasCorrectTTLIndex = function(collection, indexName, expectedExpiry, cb) {
        
        var dao = new pb.DAO();
        dao.indexInfo(collection, {full: true}, function(err, indexes) {
            if (util.isError(err)) {
                return cb(err);
            }
            
            for (var i = 0; i < indexes.length; i++) {
                
                var index = indexes[i];
                if (index.name === indexName) {
                    return cb(null, expectedExpiry === index.expireAfterSeconds);
                }
            }
            cb(new Error('The index '+indexName+' on collection '+collection+' could not be found'), false);
        });
    };
    
    return TTLIndexHelper;
};