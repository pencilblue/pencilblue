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

module.exports = Util;