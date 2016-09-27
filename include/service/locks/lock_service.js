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
var util = require('../../util.js');
var path = require('path');

module.exports = function(pb) {

    /**
     *
     * @class LockService
     * @constructor
     * @param {LockProvider} [provider]
     */
    function LockService(provider) {
        if (util.isNullOrUndefined(provider)) {
            provider = LockService.loadProvider();
        }
        if (!provider) {
            throw new Error('A valid lock provider is required. Please check your configuration. Set logging level to "silly" for more info');
        }

        /**
         *
         * @property provider
         * @type {MediaProvider}
         */
        this.provider = provider;
    }

    /**
     * Attempts to acquire a semaphore with the given name
     * @method acquire
     * @param {String} name
     * @param {Object} [options={}]
     * @param {Object} [options.payload]
     * @param {Integer} [options.timeout]
     * @param {Function} cb
     */
    LockService.prototype.acquire = function(name, options, cb) {
        if (util.isFunction(options)) {
            cb = options;
            options = {};
        }

        var opts = {
            timeout: options.timeout || pb.config.locks.timeout,
            payload: options.payload || {

                server: pb.ServerRegistration.generateServerKey(),
                instance: pb.ServerRegistration.generateKey(),
                date: new Date()
            }
        };
        this.provider.acquire(name, opts, cb);
    };

    /**
     * Retrieves the payload for the lock
     * @method get
     * @param {String} name
     * @param {Function} cb
     */
    LockService.prototype.get = function(name, cb) {
        this.provider.get(name, cb);
    };

    /**
     * Releases the lock
     * @method release
     * @param {String} name
     * @param {Object} [options={}]
     * @param {Function} cb
     */
    LockService.prototype.release = function(name, options, cb) {
        this.provider.release(name, options, cb);
    };

    /**
     * Inspects the current PB configuration to determine what lock provider to
     * instantiate and return
     * @static
     * @method loadProvider
     * @return {LockProvider} An instance of a media provider or NULL when no
     * provider can be loaded.
     */
    LockService.loadProvider = function() {
        if (pb.config.locks.provider === 'cache') {
            return new pb.locks.providers.CacheLockProvider();
        }
        else if (pb.config.locks.provider === 'db') {
            return new pb.locks.providers.DbLockProvider();
        }

        var instance = null;
        var paths = [path.join(pb.config.docRoot, pb.config.locks.provider), pb.config.locks.provider];
        for(var i = 0; i < paths.length; i++) {
            try{
                var ProviderType = require(paths[i])(pb);
                instance = new ProviderType();
                break;
            }
            catch(e){
                pb.log.silly(e.stack);
            }
        }
        return instance;
    };

    return LockService;
};
