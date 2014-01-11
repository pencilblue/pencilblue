/**
 * session_test.js
 * 
 * @author Brian Hyder <brianhyder@gmail.com>
 * @copyright PencilBlue 2014, All Rights Reserved
 */

//requires
require('../../base_test');

//constants
var DEFAULT_TIMEOUT = pb.config.session.timeout;

module.exports = {
	
	setUp: function(cb){
		pb.dbm.getDB().then(function(result){
			cb();
		});
	},

	tearDown: function(cb){
		pb.utils.onPromisesOk(pb.dbm.shutdown(), cb);
	},
	
	testShutdown: function(test){
		pb.cache.quit();
		pb.session.shutdown();
		test.done();
	}
};
