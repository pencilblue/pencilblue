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
var cache = require('../../../dao/cache').getInstance();
var log = require('../../../utils/logging').newInstance('CacheLockProvider');
var PromiseUtils = require('../../../../lib/utils/promiseUtils');
var Q = require('q');

/**
 * A lock provider that leverages the cache to create semaphores
 */
class CacheLockProvider {

    /**
     * Attempts to acquire the lock with the given name.
     * @param {String} name
     * @param {Object} [options={}]
     * @param {Object} [options.payload]
     * @param {Integer} [options.timeout]
     * @return {Promise}
     */
    acquire (name, options) {
        options = options || {};

        //try and acquire the lock
        var deferred = Q.defer();
        cache.setnx(name, JSON.stringify(options.payload), function (err, reply) {
            if (_.isError(err)) {
                return deferred.reject(err);
            }
            if (!reply) {
                return deferred.resolve(false);
            }

            //lock was created now ensure it will expire
            cache.expire(name, options.timeout /*sec*/, PromiseUtils.cbHandler(deferred));
        });
        return deferred.promise;
    }

    /**
     * Retrieves the payload for the lock
     * @param {String} name
     * @return {Promise}
     */
    get (name) {
        var deferred = Q.defer();
        cache.get(name, function (err, result) {
            if (_.isError(err)) {
                return deferred.reject(err);
            }
            if (result) {
                try {
                    result = JSON.parse(result);
                }
                catch (e) {
                    log.silly('CacheLockProvider: Failed to parse lock payload. ', e.stack);
                }
            }
            deferred.resolve(result);
        });
        return deferred.promise;
    }

    /**
     * Releases the lock
     * @param {String} name
     * @param {Object} [options={}]
     * @return {Promise}
     */
    release (name, options) {
        options = options || {};

        var deferred = Q.defer();
        cache.del(name, PromiseUtils(deferred, function (result) {
            return !!result;
        }));
        return deferred;
    }
}

module.exports = CacheLockProvider;
