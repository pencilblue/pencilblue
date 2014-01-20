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
	uid: SESSION_ID,
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
		var store   = new RedisSessionStore();
		var session = getSessionObj();
		store.get(SESSION_ID, function(err, result){
			test.equal(null, err);
			test.equal(null, result);
			
			store.set(session, function(err, result){
				test.equal(null, err);
				test.equal('OK', result);
				
				store.get(SESSION_ID, function(err, result){
					test.equal(null, err);
					test.deepEqual(session, result);
					test.done();
				});
			});
		});
	},
	
	testSetClear: function(test){
		var store   = new RedisSessionStore();
		var session = getSessionObj();
		store.set(session, function(err, result){
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
		pb.config.session.timeout = 2000;
		var store   = new RedisSessionStore();
		var session = getSessionObj();
		test.expect(4);
		store.set(session, function(err, result){
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

function getSessionObj(){
	SESSION_OBJ.timeout = new Date().getTime() + pb.config.session.timeout;
	return SESSION_OBJ;
}
