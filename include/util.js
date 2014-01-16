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