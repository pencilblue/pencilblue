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
var util = require('../util.js');

module.exports = function MemoryEntityServiceModule(pb) {

    /**
     * Memory storage service
     *
     * @module Services
     * @submodule Storage
     * @class MemoryEntityService
     * @constructor
     * @param {Object} options
     * @param {String} options.objType
     * @param {String} options.keyField
     * @param {String} [options.valueField=null]
     * @param {String} [options.site=GLOBAL_SITE]
     * @param {String} [options.onlyThisSite=false]
     * @param {Integer} [options.timeout=0] The number of seconds that a value will remain in cache
     * before expiry.
     */
    function MemoryEntityService(options){
        this.type       = TYPE;
        this.objType    = options.objType;
        this.keyField   = options.keyField;
        this.valueField = options.valueField ? options.valueField : null;
        this.storage    = STORAGE;
        this.timers     = TIMERS;
        this.timeout    = options.timeout || 0;
        this.changeHandler = MemoryEntityService.createChangeHandler(this);
        this.site       = options.site || GLOBAL_SITE;
        this.onlyThisSite = options.onlyThisSite ? true : false;

        //register change handler
        var commandInstance = pb.CommandService.getInstance();

        //ensure we can get change events
        // TODO fix memory leak here.  Each instance creates a handler but the dispose is now gone.  Need to make this generic.
        commandInstance.registerForType(MemoryEntityService.getOnChangeType(this.objType), this.changeHandler);

        //ensure we are cleaning up after ourselves
        if (REAPER_HANDLE === null) {
            MemoryEntityService.startReaper();
        }
    }

    /**
     * @private
     * @static
     * @property GLOBAL_SITE
     * @type {String}
     */
    var GLOBAL_SITE = pb.SiteService.GLOBAL_SITE;

    /**
     * @private
     * @static
     * @property TIMERS
     * @type {Object}
     */
    var TIMERS = {};

    /**
     * @private
     * @static
     * @property
     * @type {Object}
     */
    var STORAGE = {};

    /**
     * @private
     * @static
     * @property
     * @type {IntervalHandle}
     */
    var REAPER_HANDLE = null;

    /**
     * @private
     * @static
     * @readonly
     * @property DEFAULT_REAPER_INTERVAL
     * @type {number}
     */
    var DEFAULT_REAPER_INTERVAL = 30000;

    /**
     * The type string that describes the storage medium for the service
     * @private
     * @static
     * @readonly
     * @property TYPE
     * @type {String}
     */
    var TYPE = 'Memory';

    /**
     * Retrieve a value from memory
     *
     * @method get
     * @param  {String}   key
     * @param  {Function} cb  Callback function
     */
    MemoryEntityService.prototype.get = function(key, cb){
        var value = null;
        if(this.site) {
            value = getSiteValue(this, key, this.site);
        }
        if(value == null && this.site !== GLOBAL_SITE && !this.onlyThisSite) {
            value = getGlobalValue(this, key);
        }
        process.nextTick(function() { cb(null, value); });
    };

    /**
     * @private
     * @static
     * @method getSiteValue
     * @param self
     * @param key
     * @param site
     * @returns {*}
     */
    function getSiteValue(self, key, site) {
        var rawVal = null;
        var internalKey = MemoryEntityService.getKey(key, site);
        if (typeof STORAGE[internalKey] !== 'undefined') {
            rawVal = STORAGE[internalKey];
        }

        //value not found
        if (rawVal == null) {
            return null;
        }

        return getCorrectValueField(rawVal, self.valueField);
    }

    /**
     * @private
     * @static
     * @method getGlobalValue
     * @param self
     * @param key
     * @returns {*}
     */
    function getGlobalValue(self, key) {
        return getSiteValue(self, key, GLOBAL_SITE);
    }

    /**
     * @private
     * @static
     * @method getCorrectValueField
     * @param rawVal
     * @param valueField
     * @returns {*}
     */
    function getCorrectValueField(rawVal, valueField) {
        var value = null;
        if (valueField == null) {
            value = rawVal;
        }
        else {
            value = rawVal[valueField];
        }
        return value;
    }

    /**
     * Set a value in memory.  Triggers a command to be sent to the cluster to
     * update the value
     * @method set
     * @param {String} key
     * @param {*} value
     * @param {Function} cb Callback function
     */
    MemoryEntityService.prototype.set = function(key, value, cb) {
        var self = this;
        this._set(key, value, function(err, result) {
            if (result) {
                self.onSet(key, value);
            }
            cb(err, result);
        });
    };

    /**
     * Sets a value
     * @private
     * @method _set
     * @param {String} key
     * @param {Object|String|Integer|Float|Boolean} value
     * @param {Function} cb
     */
    MemoryEntityService.prototype._set = function(key, value, cb) {
        var rawValue = null;
        var internalKey = MemoryEntityService.getKey(key, this.site);
        if (STORAGE.hasOwnProperty(internalKey)) {
            rawValue = STORAGE[internalKey];
            if (this.valueField == null) {
                rawValue = value;
            }
            else {
                rawValue[this.valueField] = value;
            }
        }
        else if (this.valueField == null){
            rawValue = value;
        }
        else{
            rawValue = {
                object_type: this.objType
            };
            rawValue[this.keyField]   = key;
            rawValue[this.valueField] = value;
        }
        STORAGE[internalKey] = rawValue;

        //check for existing timeout
        this.setKeyExpiration(key);
        cb(null, true);
    };

    /**
     * Called when when a value changes
     * @method onSet
     * @param {String} key,
     * @param {Object|String|Integer|Float|Boolean} value
     */
    MemoryEntityService.prototype.onSet = function(key, value) {
        var command = {
            key: key,
            value: value,
            site: this.site,
            ignoreme: true
        };
        pb.CommandService.getInstance()
            .sendCommandToAllGetResponses(MemoryEntityService.getOnChangeType(this.objType), command, util.cb);
    };

    /**
     * Sets a timeout to purge a key after the configured timeout has occurred.  If
     * a timeout has already been set it will be cleared and a new one will be
     * created.
     * @method setKeyExpiration
     * @param {String} key The key for the value to be cleared
     */
    MemoryEntityService.prototype.setKeyExpiration = function(key) {
        if (this.timeout <= 0) {
            return;
        }

        //check for existing timeout
        var internalKey = MemoryEntityService.getKey(key, this.site);

        //now set the timeout if configured to do so
        TIMERS[internalKey] = Date.now() + this.timeout;
    };

    /**
     * Purge the key from memory
     *
     * @method purge
     * @param  {String}   key
     * @param  {Function} cb  Callback function
     */
    MemoryEntityService.prototype.purge = function(key, cb) {
        var key = MemoryEntityService.getKey(key, this.site);
        var exists = !!STORAGE[key];
        if(exists) {
            delete STORAGE[key];
            delete TIMERS[key];
        }
        process.nextTick(function() { cb(null, exists); });
    };

    MemoryEntityService.getKey = function(key, site) {
        return key + '-' + site;
    };

    /**
     * Retrieves the command type that is to be used to listen for changes to
     * key/value pairs within the registered instance
     * @static
     * @method
     * @param {String} objType The type of object being referenced
     * @return {String} The command type to be registered for
     */
    MemoryEntityService.getOnChangeType = function(objType) {
        return TYPE + '-' + objType + '-change';
    };

    /**
     * Creates a change handler that will update the value of a property when an
     * incomming command requests it.
     * @static
     * @method createChangeHandler
     */
    MemoryEntityService.createChangeHandler = function(memoryEntityService) {
        return function(command) {
            memoryEntityService._set(command.key, command.value, command.site, util.cb);
        };
    };

    /**
     * Searches for expired keys and removes them from memory
     * @static
     * @method reap
     * @return {number} The number of keys that were reaped
     */
    MemoryEntityService.reap = function() {
        var reaped = 0;
        var now = Date.now();
        var keys = Object.keys(TIMERS);
        keys.forEach(function(key) {
            if (TIMERS[key] <= now) {
                delete TIMERS[key];
                delete STORAGE[key];
                reaped++;
            }
        });
        pb.log.silly('MemoryEntityService: Scanned %s keys and reaped %s in %sms', keys.length, reaped, Date.now() - now);
        return reaped;
    };

    MemoryEntityService.startReaper = function() {
        if (REAPER_HANDLE === null) {
            REAPER_HANDLE = setInterval(MemoryEntityService.reap, DEFAULT_REAPER_INTERVAL);

            pb.system.registerShutdownHook('MemoryEntityService', MemoryEntityService.dispose);

            pb.log.silly('MemoryEntityService: Reaper started');
        }
    };

    MemoryEntityService.dispose = function(cb) {

        //release data and timeout hashes
        STORAGE = {};
        TIMERS = {};

        //stop reaping, nothing to reap
        if (REAPER_HANDLE !== null) {
            clearInterval(REAPER_HANDLE);
        }

        //clean up by un registering the change handler to prevent memory leaks
        pb.CommandService.getInstance().unregisterForType(MemoryEntityService.getOnChangeType(this.objType), this.changeHandler);
        this.changeHandler = null;

        cb(null, true);
    };

    return MemoryEntityService;
};
