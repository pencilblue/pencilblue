/**
 * 
 * @author Brian Hyder <brianhyder@gmail.com>
 * @copyright PencilBlue 2013, All Rights Reserved
 */
module.exports.logger = function(winston, config){
	var logger =  new (winston.Logger)({
	    transports: config.logging.transports,
	    level: config.log_level
   });

	logger.isDebug = function(){
		return pb.log.levels[pb.log.level] <= 1;
	};
	
	logger.isSilly = function(){
		return pb.log.levels[pb.log.level] <= 0;
	};
	
	console.log('SystemStartup: Log Level is: '+config.log_level);
	return logger;
};