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
    dao.loadByValue(this.keyField, key, this.objType, function(err, entity){
		if (util.isError(err)) {
			return cb(err);
		}

		//ensure setting exists
		if (!entity){
			return cb(null, null);
		}

		//get setting
		var val = self.valueField == null ? entity : entity[self.valueField];

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
    dao.loadByValue(this.keyField, key, this.objType, function(err, result){
		if (util.isError(err)) {
			return cb(err);
		}

		//value doesn't exist in cache
		var val = null;
		if (self.valueField == null) {
			val = value;
		}
		else{
			var rawVal = null;
			if (!result) {
				rawVal = {
					object_type: self.objType
				};
				rawVal[self.keyField]   = key;
			}
			else{
				rawVal = result;
			}
			rawVal[self.valueField] = value;
			val                     = rawVal;
		}

		//set into cache
		dao.save(val, cb);
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
	dao.delete({where: where}, this.objType, cb);
};

//exports
module.exports.DBEntityService = DBEntityService;
