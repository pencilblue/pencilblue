/**
 * cache_test.js
 * 
 * @author Brian Hyder <brianhyder@gmail.com>
 * @copyright PencilBlue 2014, All Rights Reserved
 */

//requires
require('../../../base_test');
var RedisSessionStore = require(DOCUMENT_ROOT+"/include/session/storage/redis_session_store.js");

//constants
var SESSION_ID  = 'abc123';
var SESSION_OBJ = {
	client_id: SESSION_ID,
	a: "a",
	b: "b"
};
var DEFAULT_TIMEOUT = pb.config.session.timeout;

module.exports = {
	
	setUp: function(cb){
		cb();
	},

	tearDown: function(cb){
		cb();
		pb.config.session.timeout = DEFAULT_TIMEOUT;
	},
	
	testSetGet: function(test){
		var store = new RedisSessionStore();
		store.get(SESSION_ID, function(err, result){
			test.equal(null, err);
			test.equal(null, result);
			
			store.set(SESSION_OBJ, function(err, result){
				test.equal(null, err);
				test.equal('OK', result);
				
				store.get(SESSION_ID, function(err, result){
					test.equal(null, err);
					test.deepEqual(SESSION_OBJ, result);
					test.done();
				});
			});
		});
	},
	
	testSetClear: function(test){
		var store = new RedisSessionStore();
		store.set(SESSION_OBJ, function(err, result){
			test.equal(null, err);
			test.equal('OK', result);
			
			store.clear(SESSION_ID, function(err, result){
				test.equal(null, err);
				test.equal(1, result);
				
				test.done();
			});
		});
	},
	
	testTimeout: function(test){
		pb.config.session.timeout = 2;
		var store = new RedisSessionStore();
		
		test.expect(4);
		store.set(SESSION_OBJ, function(err, result){
			test.equal(null, err);
			test.equal('OK', result);
			
			setTimeout(function(){
				
				store.get(SESSION_ID, function(err, result){
					test.equal(null, err);
					test.equal(null, result);
					test.done();
				});
			}, 3000);
		});
	},
};
