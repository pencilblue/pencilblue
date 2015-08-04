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
        this.storage    = {};
        this.timers     = {};
        this.timeout    = options.timeout || 0;
        this.changeHandler = MemoryEntityService.createChangeHandler(this);
        this.site       = options.site || GLOBAL_SITE;
        this.onlyThisSite = options.onlyThisSite ? true : false;

        //register change handler
        pb.CommandService.getInstance().registerForType(MemoryEntityService.getOnChangeType(this.objType), this.changeHandler);
    }


    var GLOBAL_SITE = pb.SiteService.GLOBAL_SITE;

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
        cb(null, value);
    };

    function getSiteValue(self, key, site)
    {
        var rawVal = null;
        if (self.storage.hasOwnProperty(site) && self.storage[site].hasOwnProperty(key)) {
            rawVal = self.storage[site][key];
        }

        //value not found
        if (rawVal == null) {
            return null;
        }

        return getCorrectValueField(rawVal, self.valueField);
    }

    function getGlobalValue(self, key)
    {
        return getSiteValue(self, key, GLOBAL_SITE);
    }

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
        if(!this.site) {
            this.site = GLOBAL_SITE;
        }
        if (this.storage.hasOwnProperty(this.site) && this.storage[this.site].hasOwnProperty(key)) {
            rawValue = this.storage[this.site][key];
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
        this.storage[this.site] = {};
        this.storage[this.site][key] = rawValue;

        //check for existing timeout
        this.setKeyExpiration(key);
        cb(null, true);
    };

    /**
     * Callend when a value changes
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
        if (this.timers[key]) {
            clearTimeout(this.timers[key]);
        }

        //now set the timeout if configured to do so
        var self = this;
        this.timers[this.site][key] = setTimeout(function() {
            self.purge(key, util.cb)
        }, this.timeout);
    };

    /**
     * Purge membory of a value
     *
     * @method purge
     * @param  {String}   key
     * @param  {Function} cb  Callback function
     */
    MemoryEntityService.prototype.purge = function(key, cb) {
        var exists = this.storage.hasOwnProperty(this.site) && this.storage[this.site].hasOwnProperty(key);
        if(exists) {
            delete this.storage[this.site][key];
        }
        cb(null, exists);
    };

    /**
     * Should be called once to clean up after the memory service instance.  
     * Removes all storage items and clears any remaining timeouts.
     * @method dispose
     */
    MemoryEntityService.prototype.dispose = function() {
        this.storage = null;

        var self = this;
        Object.keys(this.timers).forEach(function(site) {
            Object.keys(this.timers[site]).forEach(function(key){
                clearTimeout(self.timers[key]);
            });
        });
        this.timers = null;

        //clean up by un registering the change handler to prevent memory leaks
        pb.CommandService.getInstance().unregisterForType(MemoryEntityService.getOnChangeType(this.objType), this.changeHandler);
        this.changeHandler = null;
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
        return [TYPE, objType, 'change'].join('-');
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

    return MemoryEntityService;
};
