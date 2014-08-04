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
 * Database storage service
 *
 * @module Services
 * @submodule Storage
 * @class DBEntityService
 * @constructor
 * @param {String} objType
 * @param {String} valueField
 * @param {String} keyField
 */
function DBEntityService(objType, valueField, keyField){
	this.type       = 'DB';
	this.objType    = objType;
	this.keyField   = keyField;
	this.valueField = valueField ? valueField : null;
}

/**
 * Retrieve a value from the database
 *
 * @method get
 * @param  {String}   key
 * @param  {Function} cb  Callback function
 */
DBEntityService.prototype.get = function(key, cb){
	var dao              = new pb.DAO();
	var where            = {};
	where[this.keyField] = key;

	var self = this;
	dao.query(this.objType, where).then(function(result){
		if (util.isError(result)) {
			cb(result, null);
			return;
		}

		//ensure setting exists
		if (result.length == 0){
			cb(null, null);
			return;
		}

		//get setting
		var entity = result[0];
		var val    = self.valueField == null ? entity : entity[self.valueField];

		//callback with the result
		cb(null, val);
	});
};

/**
 * Set a value in the database
 *
 * @method set
 * @param {String}   key
 * @param {*}        value
 * @param {Function} cb    Callback function
 */
DBEntityService.prototype.set = function(key, value, cb) {
	var dao              = new pb.DAO();
	var where            = {};
	where[this.keyField] = key;

	var self = this;
	dao.query(this.objType, where).then(function(result){
		if (util.isError(result)) {
			cb(result, null);
			return;
		}

		//value doesn't exist in cache
		var val = null;
		if (self.valueField == null) {
			val = value;
		}
		else{
			var rawVal = null;
			if (result == null || result.length == 0) {
				rawVal = {
					object_type: self.objType
				};
				rawVal[self.keyField]   = key;
			}
			else{
				rawVal = result[0];
			}
			rawVal[self.valueField] = value;
			val                     = rawVal;
		}

		//set into cache
		dao.update(val).then(function(result){
			if (util.isError(result)) {
				cb(result, null);
			}
			else{
				cb(null, result);
			}
		});
	});
};

/**
 * Purge the database of a value
 *
 * @method purge
 * @param  {String}   key
 * @param  {Function} cb  Callback function
 */
DBEntityService.prototype.purge = function(key, cb) {
	var dao              = new pb.DAO();
	var where            = {};
	where[this.keyField] = key;
	dao.deleteMatching(where, this.objType).then(function(result){
		if (util.isError(result)) {
			cb(result, null);
		}
		else{
			cb(null, result);
		}
	});
};

//exports
module.exports.DBEntityService = DBEntityService;
