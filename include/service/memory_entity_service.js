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
 * Memory storage service
 *
 * @module Services
 * @submodule Storage
 * @class MemoryEntityService
 * @constructor
 * @param {String} objType
 * @param {String} valueField
 * @param {String} keyField
 */
function MemoryEntityService(objType, valueField, keyField){
	this.type       = 'Memory';
	this.objType    = objType;
	this.keyField   = keyField;
	this.valueField = valueField ? valueField : null;
	this.storage    = {};
}

/**
 * Retrieve a value from memory
 *
 * @method get
 * @param  {String}   key
 * @param  {Function} cb  Callback function
 */
MemoryEntityService.prototype.get = function(key, cb){
	var rawVal = null;
	if (this.storage.hasOwnProperty(key)) {
		rawVal = this.storage[key];
	}

	//value not found
	if (rawVal == null) {
		cb(null, null);
		return;
	}

	var value = null;
	if (this.valueField == null) {
		value = rawVal;
	}
	else {
		value = rawVal[this.valueField];
	}
	cb(null, value);
};

/**
 * Set a value in memory
 *
 * @method set
 * @param {String}   key
 * @param {*}        value
 * @param {Function} cb    Callback function
 */
MemoryEntityService.prototype.set = function(key, value, cb) {

	var rawValue = null;
	if (this.storage.hasOwnProperty(key)) {
		rawValue = this.storage[key];
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
	this.storage[key] = rawValue;
	cb(null, true);
};

/**
 * Purge membory of a value
 *
 * @method purge
 * @param  {String}   key
 * @param  {Function} cb  Callback function
 */
MemoryEntityService.prototype.purge = function(key, cb) {
	var exists = this.storage.hasOwnProperty(key);
	if(exists) {
		delete this.storage[key];
	}
	cb(null, exists);
};

//exports
module.exports.MemoryEntityService = MemoryEntityService;
