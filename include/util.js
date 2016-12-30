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
// dependencies
const os = require('os');
const util = require('util');
const async = require('async');
const extend = require('node.extend');
const fs = require('fs');
const path = require('path');
const uuid = require('uuid');
const RegExpUtils = require('./utils/reg_exp_utils');

/**
 * Provides a set of utility functions used throughout the code base
 *
 * @module Services
 * @class Util
 * @constructor
 */
function Util() { }

/**
 * Clones an object by serializing it and then re-parsing it.
 * WARNING: Objects with circular dependencies will cause an error to be thrown.
 * @static
 * @method clone
 * @param {Object} object The object to clone
 * @return {Object|Array} Cloned object
 */
Util.clone = object => JSON.parse(JSON.stringify(object));

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
Util.deepMerge = (from, to) => extend(true, to, from);

/**
 * Checks if the supplied object is an errof. If the object is an error the
 * function will throw the error.
 * @static
 * @method ane
 * @param {Object} obj The object to check
 */
Util.ane = (obj) => {
  if (util.isError(obj)) {
    throw obj;
  }
};

/**
 * Initializes an array with the specified number of values.  The value at each
 * index can be static or a function may be provided.  In the event that a
 * function is provided the function will be called for each item to be placed
 * into the array.  The return value of the function will be placed into the
 * array.
 * @static
 * @method initArray
 * @param {Integer} cnt The length of the array to create
 * @param {Function|String|Number} val The value to initialize each index of
 * the array
 * @return {Array} The initialized array
 */
Util.initArray = (cnt, val) => {
  const v = [];
  const isFunc = Util.isFunction(val);
  for (let i = 0; i < cnt; i += 1) {
    v.push(isFunc ? val(i) : val);
  }
  return v;
};

/**
 * Escapes a regular expression.
 * @deprecated since 0.7.1 Will be removed in 1.0.  Use RegExpUtils
 * @static
 * @method escapeRegExp
 * @param {String} The expression to escape
 * @return {String} Escaped regular expression.
 */
Util.escapeRegExp = str => RegExpUtils.escape(str);

/**
 * Merges the properties from the first parameter into the second. This modifies
 * the second parameter instead of creating a new object.
 *
 * @method merge
 * @param {Object} from
 * @param {Object} to
 * @return {Object} The 'to' variable
 */
Util.merge = (from, to) => {
  Util.forEach(from, (val, propName) => {
    to[propName] = val; // eslint-disable-line no-param-reassign
  });
  return to;
};

/**
 * Creates an object that has both the properties of "a" and "b".  When both
 * objects have a property with the same name, "b"'s value will be preserved.
 * @static
 * @method union
 * @return {Object} The union of properties from both a and b.
 */
Util.union = (a, b) => {
  const union = {};
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
 * var tasks = util.getTasks(items, function(items, i) {
 *     return function(callback) {
 *         console.log(items[i]);
 *         callback(null, null);
 *     };
 * });
 * async.series(tasks, util.cb);
 * <code>
 */
Util.getTasks = (iterable, getTaskFunction) => {
  const tasks = [];
  for (let i = 0; i < iterable.length; i += 1) {
    tasks.push(getTaskFunction(iterable, i));
  }
  return tasks;
};

/**
 * Wraps a function in an anonymous function.  The wrapper function will call
 * the wrapped function with the provided context.  This comes in handy when
 * creating your own task arrays in conjunction with the async function when a
 * prototype function needs to be called with a specific context.
 * @static
 * @method wrapTask
 * @param {*} context The value of "this" for the function to be called
 * @param {Function} func The function to be executed
 * @param {Array} [argArray] The arguments to be supplied to the func parameter
 * when executed.
 * @return {Function}
 */
Util.wrapTask = (context, func, argArray) => {
  if (!util.isArray(argArray)) {
    argArray = []; // eslint-disable-line no-param-reassign
  }
  return function (callback) {
    argArray.push(callback);
    func.apply(context, argArray);
  };
};

/**
 * Wraps a task in a context as well as a function to mark the start and end time.  The result of the task will be
 * provided in the callback as the "result" property of the result object.  The time of execution can be found as the
 * "time" property.
 * @static
 * @method wrapTimedTask
 * @param {*} context The value of "this" for the function to be called
 * @param {Function} func The function to be executed
 * @param {string} [name] The task's name
 * @param {Array} [argArray] The arguments to be supplied to the func parameter
 * when executed.
 * @return {Function}
 */
Util.wrapTimedTask = (context, func, name, argArray) => {
  if (Util.isString(argArray)) {
    name = argArray; // eslint-disable-line no-param-reassign
    argArray = []; // eslint-disable-line no-param-reassign
  }
  const task = Util.wrapTask(context, func, argArray);
  return (callback) => {
    const start = Date.now();
    task((err, result) => {
      callback(err, {
        result,
        time: Date.now() - start,
        start,
        name,
      });
    });
  };
};

/**
 * Provides an implementation of for each that accepts an array or object.
 * @static
 * @method forEach
 * @param {Object|Array} iterable
 * @param {Function} handler A function that accepts 4 parameters.  The value
 * of the current property or index.  The current index (property name if object).  The iterable.
 * Finally, the numerical index if the iterable is an object.
 */
Util.forEach = (iterable, handler) => {
  let internalHandler;
  let internalIterable;
  if (util.isArray(iterable)) {
    internalHandler = handler;
    internalIterable = iterable;
  } else if (Util.isObject(iterable)) {
    internalIterable = Object.getOwnPropertyNames(iterable);
    internalHandler = function (propName, i) {
      handler(iterable[propName], propName, iterable, i);
    };
  } else {
    return false;
  }

  // execute native foreach on interable
  return internalIterable.forEach(internalHandler);
};

/**
 * Hashes an array
 * @static
 * @method arrayToHash
 * @param {Array} array      The array to hash
 * @param {*} [defaultVal=true] Default value if the hashing fails
 * @return {Object} Hash
 */
Util.arrayToHash = (array, defaultVal) => {
  if (!util.isArray(array)) {
    return null;
  }

  // set the default value
  if (Util.isNullOrUndefined(defaultVal)) {
    defaultVal = true; // eslint-disable-line no-param-reassign
  }
  const hash = {};
  for (let i = 0; i < array.length; i += 1) {
    if (Util.isFunction(defaultVal)) {
      hash[defaultVal(array, i)] = array[i];
    } else {
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
Util.arrayToObj = (array, keyFieldOrTransform, valFieldOrTransform) => {
  if (!util.isArray(array)) {
    return null;
  }

  const keyIsString = Util.isString(keyFieldOrTransform);
  const keyIsFunc = Util.isFunction(keyFieldOrTransform);
  if (!keyIsString && !keyIsFunc) {
    return null;
  }

  const valIsString = Util.isString(valFieldOrTransform);
  const valIsFunc = Util.isFunction(valFieldOrTransform);
  if (!valIsString && !valIsFunc) {
    valFieldOrTransform = null; // eslint-disable-line no-param-reassign
  }

  const obj = {};
  for (let i = 0; i < array.length; i += 1) {
    const item = array[i];
    const key = keyIsString ? item[keyFieldOrTransform] : keyFieldOrTransform(array, i);

    if (valIsString) {
      obj[key] = item[valFieldOrTransform];
    } else if (valIsFunc) {
      obj[key] = valFieldOrTransform(array, i);
    } else {
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
Util.objArrayToHash = (array, hashProp) => {
  if (!util.isArray(array)) {
    return null;
  }

  const hash = {};
  for (let i = 0; i < array.length; i += 1) {
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
Util.hashToArray = (obj, hashKeyProp) => {
  if (!Util.isObject(obj)) {
    return null;
  }

  const doHashKeyTransform = Util.isString(hashKeyProp);
  return Object.keys(obj).reduce((prev, prop) => {
    prev.push(obj[prop]);
    if (doHashKeyTransform) {
      obj[prop][hashKeyProp] = prop; // eslint-disable-line no-param-reassign
    }
    return prev;
  }, []);
};

/**
 * Inverts a hash
 * @static
 * @method invertHash
 * @param {Object} obj Hash object
 * @return {Object} Inverted hash
 */
Util.invertHash = (obj) => {
  if (!Util.isObject(obj)) {
    return null;
  }

  const newObj = {};
  const has = Object.prototype.hasOwnProperty;

  Object.keys(obj).forEach((prop) => {
    if (has.call(obj, prop)) {
      newObj[obj[prop]] = prop;
    }
  });

  return newObj;
};

/**
 * Clones an array
 * @static
 * @method copyArray
 * @param {Array} array
 * @return {Array} Cloned array
 */
Util.copyArray = (array) => {
  if (!util.isArray(array)) {
    return null;
  }

  const clone = [];
  for (let i = 0; i < array.length; i += 1) {
    clone.push(array[i]);
  }
  return clone;
};

Util.dedupeArray = (array) => {
  const hash = Util.arrayToHash(array);
  return Object.keys(hash);
};

/**
 * Pushes all of one array's values into another
 * @static
 * @method arrayPushAll
 * @param {Array} from
 * @param {Array} to
 * @return {Boolean} FALSE when the parameters are not Arrays
 */
Util.arrayPushAll = (from, to) => {
  if (!util.isArray(from) || !util.isArray(to)) {
    return false;
  }

  for (let i = 0; i < from.length; i += 1) {
    to.push(from[i]);
  }
  return true;
};

/**
 * Empty callback function just used as a place holder if a callback is required
 * and the result is not needed.
 * @static
 * @method cb
 */
Util.cb = (/* err, result */) => {
  // do nothing
};

/**
 * Creates a unique Id
 * @static
 * @method uniqueId
 * @return {String} Unique Id Object
 */
Util.uniqueId = () => uuid.v4();

/**
 * Tests if a value is an object
 * @static
 * @method isObject
 * @param {*} value
 * @return {Boolean}
 */
Util.isObject = value => !Util.isNullOrUndefined(value) && typeof value === 'object';

/**
 * Tests if a value is an string
 * @static
 * @method isString
 * @param {*} value
 * @return {Boolean}
 */
Util.isString = value => !Util.isNullOrUndefined(value) && typeof value === 'string';

/**
 * Tests if a value is a function
 * @static
 * @method isFunction
 * @param {*} value
 * @return {Boolean}
 */
Util.isFunction = value => !Util.isNullOrUndefined(value) && typeof value === 'function';

/**
 * Tests if a value is NULL or undefined
 * @static
 * @method isNullOrUndefined
 * @param {*} value
 * @return {Boolean}
 */
Util.isNullOrUndefined = value => value === null || typeof value === 'undefined';
/**
 * Tests if a value is a boolean
 * @static
 * @method isBoolean
 * @param {*} value
 * @return {Boolean}
 */
Util.isBoolean = value => value === true || value === false;

/**
 * Retrieves the subdirectories of a path
 * @static
 * @method getDirectories
 * @param {String}   dirPath The starting path
 * @param {Function} cb      Callback function
 */
Util.getDirectories = (dirPath, cb) => {
  const dirs = [];
  fs.readdir(dirPath, (err, files) => {
    if (util.isError(err)) {
      return cb(err);
    }

    const tasks = Util.getTasks(files, (eachFiles, index) =>
      (callback) => {
        const fullPath = path.join(dirPath, eachFiles[index]);
        fs.stat(fullPath, (statErr, stat) => {
          if (util.isError(statErr)) {
            return cb(statErr);
          }
          if (Util.isNullOrUndefined(stat)) {
            console.log('WARN: Util: unstatable file encountered: %s', fullPath);
          } else if (stat.isDirectory()) {
            dirs.push(fullPath);
          }
          return callback(statErr);
        });
      });
    return async.parallel(tasks, (asyncErr /* , results */) => {
      cb(asyncErr, dirs);
    });
  });
};

/**
 * Retrieves file and/or directorie absolute paths under a given directory path.
 * @static
 * @method getFiles
 * @param {String} dirPath The path to the directory to be examined
 * @param {Object} [options] Options that customize the results
 * @param {Boolean} [options.recursive=false] A flag that indicates if
 * directories should be recursively searched.
 * @param {Function} [options.filter] A function that returns a boolean
 * indicating if the file should be included in the result set.  The function
 * should take two parameters.  The first is a string value representing the
 * absolute path of the file.  The second is the stat object for the file.
 * @param {Function} cb A callback that takes two parameters. The first is an
 * Error, if occurred. The second is an array of strings representing the
 * absolute paths for files that met the criteria specified by the filter
 * function.
 */
Util.getFiles = (dirPath, options, cb) => {
  if (Util.isFunction(options)) {
    cb = options;  // eslint-disable-line no-param-reassign
    options = {  // eslint-disable-line no-param-reassign
      recursive: false,
      filter: (/* fullPath, stat */) => true,
    };
  }

  // read files from dir
  fs.readdir(dirPath, (err, q) => {
    if (util.isError(err)) {
      return cb(err);
    }

    // seed the queue with the absolute paths not just the file names
    for (let i = 0; i < q.length; i += 1) {
      q[i] = path.join(dirPath, q[i]); // eslint-disable-line no-param-reassign
    }

    // process the q
    const filePaths = [];
    return async.whilst(
      () => q.length > 0,
      (callback) => {
        const fullPath = q.shift();
        fs.stat(fullPath, (statErr, stat) => {
          if (util.isError(statErr)) {
            return callback(statErr);
          }

          // apply filter
          let meetsCriteria = true;
          if (Util.isFunction(options.filter)) {
            meetsCriteria = options.filter(fullPath, stat);
          }

          // examine result and add it when criteria is met
          if (meetsCriteria) {
            filePaths.push(fullPath);
          }

          // when recursive queue up directory's for processing
          if (!options.recursive || !stat.isDirectory()) {
            return callback(null);
          }

          // read the directory contents and append it to the queue
          return fs.readdir(fullPath, (readDirErr, childFiles) => {
            if (util.isError(readDirErr)) {
              return callback(readDirErr);
            }

            childFiles.forEach((item) => {
              q.push(path.join(fullPath, item));
            });
            return callback(null);
          });
        });
      },
      (asyncErr) => {
        cb(asyncErr, filePaths);
      });
  });
};

/* Asynchronously makes the specified directory structure.
 * @static
 * @method mkdirsSync
 * @param {String} absoluteDirPath The absolute path of the directory structure
 * to be created
 * @param {Boolean} isFileName When true the value after the last file
 * separator is treated as a file.  This means that a directory with that value
 * will not be created.
 * @param {Function} cb A callback that provides an error, if occurred
 */
Util.mkdirs = (absoluteDirPath, isFileName, cb) => {
  if (Util.isFunction(isFileName)) {
    cb = isFileName; // eslint-disable-line no-param-reassign
    isFileName = false; // eslint-disable-line no-param-reassign
  }

  if (!Util.isString(absoluteDirPath)) {
    return cb(new Error('absoluteDirPath must be a valid file path'));
  }

  const piecesSplited = absoluteDirPath.split(path.sep);
  let curr = '';
  const isWindows = os.type().toLowerCase().indexOf('windows') !== -1;
  const tasks = Util.getTasks(piecesSplited, (pieces, i) =>
    (callback) => {
      // we need to skip the first one bc it will probably be empty and we
      // want to skip the last one because it will probably be the file
      // name not a directory.
      const p = pieces[i];
      if (p.length === 0 || (isFileName && i >= pieces.length - 1)) {
        return callback();
      }

      curr += (isWindows && i === 0 ? '' : path.sep) + p;
      return fs.exists(curr, (exists) => {
        if (exists) {
          return callback();
        }
        return fs.mkdir(curr, callback);
      });
    });
  return async.series(tasks, (err /* , results */) => {
    cb(err);
  });
};

/**
 * Synchronously makes the specified directory structure.
 * @static
 * @method mkdirsSync
 * @param {String} absoluteDirPath The absolute path of the directory structure
 * to be created
 * @param {Boolean} isFileName When true the value after the last file
 * separator is treated as a file.  This means that a directory with that value
 * will not be created.
 */
Util.mkdirsSync = function (absoluteDirPath, isFileName) {
  if (!Util.isString(absoluteDirPath)) {
    throw new Error('absoluteDirPath must be a valid file path');
  }

  const pieces = absoluteDirPath.split(path.sep);
  let curr = '';
  const isWindows = os.type().toLowerCase().indexOf('windows') !== -1;
  pieces.forEach((p, i) => {
    // we need to skip the first one bc it will probably be empty and we
    // want to skip the last one because it will probably be the file
    // name not a directory.
    if (p.length === 0 || (isFileName && i >= pieces.length - 1)) {
      return;
    }

    curr += (isWindows && i === 0 ? '' : path.sep) + p;
    if (!fs.existsSync(curr)) {
      fs.mkdirSync(curr);
    }
  });
};

/**
 * Retrieves the extension off of the end of a string that represents a URI to
 * a resource
 * @static
 * @method getExtension
 * @param {String} filePath URI to the resource
 * @param {Object} [options]
 * @param {Boolean} [options.lower=false] When TRUE the extension will be returned as lower case
 * @param {String} [options.sep] The file path separator used in the path.
 *  Defaults to the OS default.
 * @return {String} The value after the last '.' character
 */
Util.getExtension = (filePath, options) => {
  if (!Util.isString(filePath) || filePath.length <= 0) {
    return null;
  }
  if (!Util.isObject(options)) {
    options = {}; // eslint-disable-line no-param-reassign
  }

  // do to the end of the path
  const pathPartIndex = filePath.lastIndexOf(options.sep || path.sep) || 0;
  if (pathPartIndex > -1) {
    filePath = filePath.substr(pathPartIndex); // eslint-disable-line no-param-reassign
  }

  let ext = null;
  const index = filePath.lastIndexOf('.');
  if (index >= 0) {
    ext = filePath.substring(index + 1);

    // apply options
    if (options.lower) {
      ext = ext.toLowerCase();
    }
  }
  return ext;
};

/**
 * Creates a filter function to be used with the
 *  getFiles function to skip files that are not of the specified type
 * @static
 * @method getFileExtensionFilter
 * @param extension
 * @return {Function}
 */
Util.getFileExtensionFilter = (extension) => {
  const ext = `.${extension}`;
  return fullPath => fullPath.lastIndexOf(ext) === (fullPath.length - ext.length);
};

// inherit from node's version of 'util'.  We can't use node's "util.inherits"
// function because util is an object and not a prototype.
Util.merge(util, Util);

/**
 * Overrides the basic inherit functionality to include static functions and
 * properties of prototypes
 * @static
 * @method inherits
 * @param {Function} Type1
 * @param {Function} Type2
 */
Util.inherits = (Type1, Type2) => {
  if (Util.isNullOrUndefined(Type1) || Util.isNullOrUndefined(Type2)) {
    throw new Error('The type parameters must be objects or prototypes');
  }

  util.inherits(Type1, Type2);
  Util.merge(Type2, Type1);
};

/**
 * Provides typical conversions for time
 * @static
 * @readonly
 * @property TIME
 * @type {Object}
 */
Util.TIME = Object.freeze({

  MILLIS_PER_SEC: 1000,
  MILLIS_PER_MIN: 60000,
  MILLIS_PER_HOUR: 3600000,
  MILLIS_PER_DAY: 86400000,
});

// exports
module.exports = Util;
