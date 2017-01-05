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
var _ = require('lodash');
var DAO = require('../../../dao/dao');
var log = require('../../../utils/logging').newInstance('DbLockProvider');

/**
 * A lock provider that leverages the DB to create semaphores
 */
class DbLockProvider {

    /**
     *
     * @readonly
     * @type {String}
     */
    static get LOCK_COLLECTION() {
        return 'lock';
    }

    /**
     *
     * @readonly
     * @type {Integer}
     */
    static get EXPECTED_ERROR_CODE() {
        return 11000;
    }

    /**
     * Attempts to acquire the lock with the given name.
     * @param {String} name
     * @param {Object} [options={}]
     * @param {Object} [options.payload]
     * @param {Integer} [options.timeout] Lock timeout in seconds
     * @param {Function} cb
     */
    acquire (name, options, cb) {
        if (_.isFunction(options)) {
            cb = options;
            options = {};
        }

        //calculate the lock expiration
        var timeout = new Date(Date.now() + (options.timeout * 1000));

        //try and acquire the lock
        var lock = {
            object_type: DbLockProvider.LOCK_COLLECTION,
            name: name,
            payload: options.payload,
            timeout: timeout
        };
        var dao = new DAO();
        dao.save(lock, function (err, result) {
            if (_.isError(err)) {
                log.silly('DbLockProvider: Failed to insert lock document: CODE=%s\n%s', err.code, err.stack);
                //when unique constraint error occurs send no error.  It means
                //the lock exists
                return cb(err.code === DbLockProvider.EXPECTED_ERROR_CODE ? null : err, false);
            }
            cb(null, true);
        });
    }

    /**
     * Retrieves the payload for the lock
     * @param {String} name
     * @param {Function} cb
     */
    get (name, cb) {
        var dao = new DAO();
        dao.loadByValue('name', name, DbLockProvider.LOCK_COLLECTION, function (err, result) {
            if (_.isObject(result)) {
                result = result.payload;
            }
            cb(err, result);
        });
    }

    /**
     * Releases the lock
     * @param {String} name
     * @param {Object} [options={}]
     * @param {Function} cb
     */
    release(name, options, cb) {
        if (_.isFunction(options)) {
            cb = options;
            options = {};
        }

        var where = {
            name: name
        };
        var dao = new DAO();
        dao.delete(where, DbLockProvider.LOCK_COLLECTION, cb);
    }
}

module.exports = DbLockProvider;
