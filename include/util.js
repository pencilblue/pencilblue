/**
 * Util
 * Provides a set of utility functions used throughout the code base
 * 
 * @author Brian Hyder <brianhyder@gmail.com>
 * @copyright PencilBlue 2013, All Rights Reserved
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
 * Assets Not Error.  If the object is an error the function will throw the error.  If the
 */
Util.ane = function(obj){
	if (util.isError(obj)) {
		throw obj;
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

// TODO: Brian, let me know how you want these functions to work, so we can put a clone function into it. For now it's in the content include.
