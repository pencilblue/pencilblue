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
     * A lock provider that leverages the DB to create semaphores
     * @class DbLockProvider
     * @constructor
     */
    function DbLockProvider() {}
    
    /**
     *
     * @private
     * @static 
     * @readonly
     * @property LOCK_COLLECTION
     * @type {String}
     */
    var LOCK_COLLECTION = 'lock';
    
    /**
     *
     * @private
     * @static 
     * @readonly
     * @property EXPECTED_ERROR_CODE
     * @type {Integer}
     */
    var EXPECTED_ERROR_CODE = 11000;
    
    /**
     * Attempts to acquire the lock with the given name.  
     * @method acquire
     * @param {String} name
     * @param {Object} [options={}]
     * @param {Object} [options.payload]
     * @param {Integer} [options.timeout] Lock timeout in seconds
     * @param {Function} cb
     */
    DbLockProvider.prototype.acquire = function(name, options, cb) {
        if (util.isFunction(options)) {
            cb = options;
            options = {}
        }
        
        //calculate the lock expiration
        var timeout = new Date(Date.now() + (options.timeout * 1000));
        
        //try and acquire the lock
        var lock = {
            object_type: LOCK_COLLECTION,
            name: name,
            payload: options.payload,
            timeout: timeout
        };
        var dao = new pb.DAO();
        dao.save(lock, function(err, result) {
            if (util.isError(err)) {
                pb.log.silly('DbLockProvider: Failed to insert lock document: CODE=%s\n%s', err.code, err.stack);
                //when unique constraint error occurs send no error.  It means 
                //the lock exists
                return cb(err.code === EXPECTED_ERROR_CODE ? null : err, false);
            }
            cb(null, true);
        });
    };
    
    /**
     * Retrieves the payload for the lock
     * @method get
     * @param {String} name
     * @param {Function} cb
     */
    DbLockProvider.prototype.get = function(name, cb) {
        var dao = new pb.DAO();
        dao.loadByValue('name', name, LOCK_COLLECTION, function(err, result) {
            if (util.isObject(result)) {
                result = result.payload;
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
    DbLockProvider.prototype.release = function(name, options, cb) {
        if (util.isFunction(options)) {
            cb = options;
            options = {};
        }
        
        var where = {
            name: name
        };
        var dao = new pb.DAO();
        dao.delete(where, LOCK_COLLECTION, cb);
    };
    
    return DbLockProvider;
};
