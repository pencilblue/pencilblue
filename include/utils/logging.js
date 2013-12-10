/**
 * 
 * @author Brian Hyder <brianhyder@gmail.com>
 * @copyright PencilBlue 2013, All Rights Reserved
 */
module.exports.logger = function(winston, config){
	return new (winston.Logger)({
	    transports: config.logging.transports
   });
};