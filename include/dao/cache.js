/**
 * 
 * @author Brian Hyder <brianhyder@gmail.com>
 * @copyright PencilBlue 2014, All Rights Reserved
 */
module.exports.createClient = function(config){
	return require(config.cache.fake ? "fakeredis" : "redis")
		.createClient(config.cache.port, config.cache.host, config.cache);
};