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

/**
 * Merges the properties from the first parameter into the second.  This 
 * modifies the second parameter instead of creating a new object.
 */
Util.merge = function(from, to) {
	for (var prop in from) {
		to[key] = from[prop];
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
	return global.uniqueID();
};

Util.TIME = {
	
	MILLIS_PER_SEC: 1000,
	MILLIS_PER_MIN: 60000,
	MILLIS_PER_HOUR: 3600000,
	MILLIS_PER_DAY: 86400000
};

module.exports = Util;
