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

/**
 * Takes an array of promises and waits for each to be resolved before calling
 * back.
 * @static
 * @method onPromisesOk
 * @param {Array} promises
 * @param {Function} A callback that takes zero arguments.  It is executed when
 * all promises have been resolved.
 */
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
 * @static
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
 * @static
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
 * @static
 * @method ane
 * @param {Object} obj The object to check
 */
Util.ane = function(obj){
	if (util.isError(obj)) {
		throw obj;
	}
};

/**
 * Escapes a regular expression.
 * @static
 * @method escapeRegExp
 * @param {String} The expression to escape
 * @return {String} Escaped regular expression.
 */
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

/**
 * Creates an object that has both the properties of "a" and "b".  When both
 * objects have a property with the same name, "b"'s value will be preserved.
 * @static
 * @method union
 * @return {Object} The union of properties from both a and b.
 */
Util.union = function(a, b) {
	var union = {};
	Util.merge(a, union);
	Util.merge(b, union);
	return union;
};

/**
 * Creates a set of tasks that can be executed by the "async" module.
 * @static
 * @method getTasks
 * @param {Array} iterable The array of items to build tasks for
 * @param {Function} getTaskFunction The function that creates and returns the
 * task to be executed.
 * @example
 * <code>
 * var items = ['apple', 'orange'];
 * var tasks = pb.utils.getTasks(items, function(items, i) {
 *     return function(callback) {
 *         console.log(items[i]);
 *         callback(null, null);
 *     };
 * });
 * async.series(tasks, pb.utils.cb);
 * <code>
 */
Util.getTasks = function (iterable, getTaskFunction) {
	var tasks = [];
	for (var i = 0; i < iterable.length; i++) {
		tasks.push(getTaskFunction(iterable, i));
	}
	return tasks;
};

/**
 * Hashes an array
 * @static
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
 * Converts an array to an object.  
 * @static
 * @method arrayToObj
 * @param {Array} array The array of items to transform from an array to an 
 * object
 * @param {String|Function} keyFieldOrTransform When this field is a string it 
 * is expected that the array contains objects and that the objects contain a 
 * property that the string represents.  The value of that field will be used 
 * as the property name in the new object.  When this parameter is a function 
 * it is passed two parameters: the array being operated on and the index of 
 * the current item.  It is expected that the function will return a value 
 * representing the key in the new object.
 * @param {String|Function} [valFieldOrTransform] When this value is a string 
 * it is expected that the array contains objects and that the objects contain 
 * a property that the string represents.  The value of that field will be used 
 * as the property value in the new object.  When this parameter is a function 
 * it is passed two parameters: the array being operated on and the index of 
 * the current item.  It is expected that the function return a value 
 * representing the value of the derived property for that item.
 * @return {Object} The converted array.
 */
Util.arrayToObj = function(array, keyFieldOrTransform, valFieldOrTransform) {
    if (!util.isArray(array)) {
		return null;
	}
    
    var keyIsString = Util.isString(keyFieldOrTransform);
    var keyIsFunc   = Util.isFunction(keyFieldOrTransform);
    if (!keyIsString && !keyIsFunc) {
        return null;
    }
    
    var valIsString = Util.isString(valFieldOrTransform);
    var valIsFunc   = Util.isFunction(valFieldOrTransform);
    if (!Util.isString(valFieldOrTransform) && !Util.isFunction(valFieldOrTransform)) {
        valFieldOrTransform = null;
    }
    
    var obj = {};
    for (var i = 0; i < array.length; i++) {
        
        var item = array[i];
        var key  = keyIsString ? item[keyFieldOrTransform] : keyFieldOrTransform(array, i);
        
        var val;
        if (valIsString) {
            obj[key] = item[valFieldOrTransform];
        }
        else if (valIsFunc) {
            obj[key] = valFieldOrTransform(array, i);   
        }
        else {
            obj[key] = item;
        }
    }
    return obj;
};

/**
 * Converts an array of objects into a hash where the key the value of the 
 * specified property. If multiple objects in the array have the same value for 
 * the specified value then the last one found will be kept.
 * @static
 * @method objArrayToHash
 * @param {Array} array The array to convert
 * @param {String} hashProp The property who's value will be used as the key 
 * for each object in the array.
 * @return {Object} A hash of the values in the array
 */
Util.objArrayToHash = function(array, hashProp) {
    if (!util.isArray(array)) {
		return null;
	}
    
    var hash = {};
	for(var i = 0; i < array.length; i++) {
        hash[array[i][hashProp]] = array[i];
	}
	return hash;
};

/**
 * Converts a hash to an array. When provided, the hashKeyProp will be the
 * property name of each object in the array that holds the hash key.
 * @static
 * @method hashToArray
 * @param {Object} obj The object to convert
 * @param {String} [hashKeyProp] The property name that will hold the hash key.
 * @return {Array} An array of each property value in the hash.
 */
Util.hashToArray = function(obj, hashKeyProp) {
	if (!Util.isObject(obj)) {
		return null;
	}

	var a                  = [];
    var doHashKeyTransform = Util.isString(hashKeyProp);
	for (var prop in obj) {
		a.push(obj[prop]);
        if (doHashKeyTransform) {
            obj[prop][hashKeyProp] = prop;
        }
	}
	return a;
};

/**
 * Inverts a hash
 * @static
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
 * @static
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
 * @static
 * @method arrayPushAll
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
 * @static
 * @method cb
 */
Util.cb = function(err, result){
	//do nothing
};

/**
 * Creates a unique Id
 * @static
 * @method uniqueId
 * @return {ObjectID} Unique Id Object
 */
Util.uniqueId = function(){
	return new ObjectID();
};

/**
 * Tests if a value is an object
 * @static
 * @method isObject
 * @param {*} value
 * @return {Boolean}
 */
Util.isObject = function(value) {
	return value != undefined && value != null && typeof value === 'object';
};

/**
 * Tests if a value is an string
 * @static
 * @method isString
 * @param {*} value
 * @return {Boolean}
 */
Util.isString = function(value) {
	return value != undefined && value != null && typeof value === 'string';
};

/**
 * Tests if a value is a function
 * @static
 * @method isFunction
 * @param {*} value
 * @return {Boolean}
 */
Util.isFunction = function(value) {
	return value != undefined && value != null && typeof value === 'function';
};

/**
 * Tests if a value is a boolean
 * @static
 * @method isBoolean
 * @param {*} value
 * @return {Boolean}
 */
Util.isBoolean = function(value) {
    return value === true || value === false;
}

/**
 * Retrieves the subdirectories of a path
 * @static
 * @method getDirectories
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

/**
 * Provides typical conversions for time
 * @property TIME
 * @type {Object}
 */
Util.TIME = {

	MILLIS_PER_SEC: 1000,
	MILLIS_PER_MIN: 60000,
	MILLIS_PER_HOUR: 3600000,
	MILLIS_PER_DAY: 86400000
};

//exports
module.exports = Util;
