/**
 * Util
 * Provides a set of utility functions used throughout the code base
 * 
 * @author Brian Hyder <brianhyder@gmail.com>
 * @copyright PencilBlue 2014, All Rights Reserved
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
 * NOTE: This probably isn't very efficient.  Need to benchmark it.  
 * WARNING: Objects with circular dependencies will cause an error to be thrown.
 */
Util.clone = function(object){
    return JSON.parse(JSON.stringify(object));
};

/**
 * Assets Not Error.  If the object is an error the function will throw the error.  If the
 */
Util.ane = function(obj){
	if (util.isError(obj)) {
		throw obj;
	}
};

Util.urlJoin = function() {
	var parts = [];
	for (var i = 0; i < arguments.length; i++) {
		var segment = ('' + arguments[i]).replace(/\\/g, '/');
		parts.push(segment.replace(/^\/|\/$/g, ''));
	}
	var url = parts.join('/');console.log('parts='+util.inspect(parts));
	if (arguments.length > 0 && (arguments[0].charAt(0) === '/' || arguments[0].charAt(0) == '\\') && url.charAt(0) !== '/') {
		url = '/'+url;
	}
	return url;
};

Util.getCustomUrl = function(prefix, url) {
	var index = prefix.lastIndexOf('/');
	if (index != prefix.length - 1) {
		prefix += '/';
	}
	
	index = url.lastIndexOf(prefix);
	if (index < 0) {
		return null;
	}
	
	//check for prefix at the end
	if (index == url.length - 1) {
		return '';
	}
	return url.substring(index + 1);
};

Util.isExternalUrl = function(urlStr, request) {
	var obj    = url.parse(urlStr);
    var reqUrl = null;
    
    if(!obj.host)
    {
        return false;
    }
    
    if(request) {
        reqUrl = url.parse(request.url);
    }
    else {
        reqUrl = url.parse(pb.config.siteRoot);
    }

    return reqUrl.host !== obj.host;
};

Util.isFullyQualifiedUrl = function(urlStr) {
	return Util.isString(urlStr) && urlStr.indexOf('http') === 0;
};

/**
 * Merges the properties from the first parameter into the second. This modifies
 * the second parameter instead of creating a new object.
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

Util.uniqueId = function(){
	return new ObjectID();
};

Util.isObject = function(value) {
	return value != undefined && value != null && typeof value === 'object';
};

Util.isString = function(value) {
	return value != undefined && value != null && typeof value === 'string';
};

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
