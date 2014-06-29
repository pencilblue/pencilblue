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

//dependencies
var extend = require('node.extend');

/**
 * Provides a set of utility functions used throughout the code base
 *
 * @module Services
 * @class Util
 * @constructor
 */
function Util(){};

Util.onPromisesOk = function(promises, cb){

	var cnt = 0;
	for(var i = 0; i < promises.length; i++){

		promises[i].then(function(result){

			pb.log.debug("Promise ["+cnt+"] Compelted");
			if(++cnt == promises.length){
				pb.log.debug("All promises Accounted for");
				cb();
			}
		});
	}
};

/**
 * Clones an object by serializing it and then re-parsing it.
 * WARNING: Objects with circular dependencies will cause an error to be thrown.
 *
 * @method clone
 * @param {Object} object The object to clone
 * @return {Object} Cloned object
 */
Util.clone = function(object){
    return JSON.parse(JSON.stringify(object));
};

/**
 * Performs a deep merge and returns the result.  <b>NOTE:</b> DO NOT ATTEMPT
 * TO MERGE PROPERTIES THAT REFERENCE OTHER PROPERTIES.  This could have
 * unintended side-effects as well as cause errors due to circular dependencies.
 *
 * @method deepMerge
 * @param {Object} from
 * @param {Object} to
 * @return {Object}
 */
Util.deepMerge = function(from, to) {
    return extend(true, to, from);
};

/**
 * Checks if the supplied object is an errof. If the object is an error the
 * function will throw the error.
 *
 * @method ane
 * @param {Object} obj The object to check
 */
Util.ane = function(obj){
	if (util.isError(obj)) {
		throw obj;
	}
};

Util.escapeRegExp = function(str) {
	if (!Util.isString(str)) {
		return null;
	}
	return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
};

/**
 * Merges the properties from the first parameter into the second. This modifies
 * the second parameter instead of creating a new object.
 *
 * @method merge
 * @param {Object} from
 * @param {Object} to
 */
Util.merge = function(from, to) {
	for (var prop in from) {
		to[prop] = from[prop];
	}
};

Util.union = function(a, b) {
	var union = {};
	Util.merge(a, union);
	Util.merge(b, union);
	return union;
};

Util.getTasks = function (iterable, getTaskFunction) {
	var tasks = [];
	for (var i = 0; i < iterable.length; i++) {
		tasks.push(getTaskFunction(iterable, i));
	}
	return tasks;
};

/**
 * Hashes an array
 *
 * @method arrayToHash
 * @param {Array} array      The array to hash
 * @param {*} defaultVal Default value if the hashing fails
 * @return {Object} Hash
 */
Util.arrayToHash = function(array, defaultVal) {
	if (!util.isArray(array)) {
		return null;
	}

	defaultVal = defaultVal || true;
	var hash = {};
	for(var i = 0; i < array.length; i++) {
		if (typeof defaultVal === 'function') {
			hash[defaultVal(array, i)] = array[i];
		}
		else {
			hash[array[i]] = defaultVal;
		}
	}
	return hash;
};

/**
 * Converts a hash to an array
 *
 * @method hashToArray
 * @param {Object} obj Hash object
 * @return {Array}
 */
Util.hashToArray = function(obj) {
	if (!Util.isObject(obj)) {
		return null;
	}

	var a = [];
	for (var prop in obj) {
		a.push(obj[prop]);
	}
	return a;
};

/**
 * Inverts a hash
 *
 * @method invertHash
 * @param {Object} obj Hash object
 * @return {Object} Inverted hash
 */
Util.invertHash = function(obj) {
	if (!Util.isObject(obj)) {
		return null;
	}

	var new_obj = {};
	for (var prop in obj) {
		if (obj.hasOwnProperty(prop)) {
			new_obj[obj[prop]] = prop;
		}
	}
	return new_obj;
};

/**
 * Clones an array
 *
 * @method copyArray
 * @param {Array} array
 * @return {Array} Cloned array
 */
Util.copyArray = function(array) {
	if (!util.isArray(array)) {
		return null;
	}

	var clone = [];
	for (var i = 0; i < array.length; i++) {
		clone.push(array[i]);
	}
	return clone;
};

/**
 * Pushes all of one array's values into another
 * @param {Array} from
 * @param {Array} to
 */
Util.arrayPushAll = function(from, to) {
	if (!util.isArray(from) || !util.isArray(to)) {
		return;
	}

	for (var i = 0; i < from.length; i++) {
		to.push(from[i]);
	}
};

/**
 * Empty callback function just used as a place holder if a callback is required
 * and the result is not needed.
 */
Util.cb = function(err, result){
	//do nothing
};

/**
 * Creates a unique Id
 *
 * @method uniqueId
 * @return {Object} Unique Id Object
 */
Util.uniqueId = function(){
	return new ObjectID();
};

/**
 * Tests if a value is an object
 *
 * @method isObject
 * @param {*} value
 * @return {Boolean}
 */
Util.isObject = function(value) {
	return value != undefined && value != null && typeof value === 'object';
};

/**
 * Tests if a value is an string
 *
 * @method isString
 * @param {*} value
 * @return {Boolean}
 */
Util.isString = function(value) {
	return value != undefined && value != null && typeof value === 'string';
};

/**
 * Tests if a value is a function
 *
 * @method isFunction
 * @param {*} value
 * @return {Boolean}
 */
Util.isFunction = function(value) {
	return value != undefined && value != null && typeof value === 'function';
};

/**
 * Tests if a value is a boolean
 *
 * @method isBoolean
 * @param {*} value
 * @return {Boolean}
 */
Util.isBoolean = function(value) {
    return value === true || value === false;
}

/**
 * Retrieves the subdirectories of a path
 * @param {String}   dirPath The starting path
 * @param {Function} cb      Callback function
 */
Util.getDirectories = function(dirPath, cb) {

	var dirs = [];
	fs.readdir(dirPath, function(err, files) {
		if (util.isError(err)) {
			cb(err, null);
			return;
		}

		var tasks = pb.utils.getTasks(files, function(files, index) {
			return function(callback) {

				var fullPath = path.join(dirPath, files[index]);
				fs.stat(fullPath, function(err, stat) {
					if (util.isError(err)) {
						pb.log.error("Failed to get stats on file ["+fullPath+"]: "+err);
					}
					else if (stat.isDirectory()) {
						dirs.push(fullPath);
					}
					callback(err, null);
				});
			};
		});
		async.parallel(tasks, function(err, results) {
			cb(err, dirs);
		});
	});
};

Util.TIME = {

	MILLIS_PER_SEC: 1000,
	MILLIS_PER_MIN: 60000,
	MILLIS_PER_HOUR: 3600000,
	MILLIS_PER_DAY: 86400000
};

module.exports = Util;
