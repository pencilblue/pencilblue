/**
 * cache_test.js
 * 
 * @author Brian Hyder <brianhyder@gmail.com>
 * @copyright PencilBlue 2014, All Rights Reserved
 */

//requires
require('../../../base_test');
var MongoSessionStore = require(DOCUMENT_ROOT+"/include/session/storage/mongo_session_store.js");

//constants
var DEFAULT_TIMEOUT = pb.config.session.timeout;

module.exports = {
	
	setUp: function(cb){
		MongoSessionStore.startReaper();
		pb.dbm.getDB().then(function(result){
			cb();
		});
	},

	tearDown: function(cb){
		var cnt = 0;
		var promises = pb.dbm.shutdown();
		for(var i = 0; i < promises.length; i++){
			promises[i].then(function(result){
				pb.log.debug("Promise ["+cnt+"] Compelted");
				if(++cnt == promises.length){
					pb.log.debug("All promises Accounted for");
					cb();
				}
			});
		}
		pb.config.session.timeout = DEFAULT_TIMEOUT;
		MongoSessionStore.shutdown();
	},
	
	testSetGet: function(test){
		var session = getSessionObject('abc'+Math.random());
		var store   = new MongoSessionStore();
		store.get(session.client_id, function(err, result){
			test.equal(null, err);
			test.equal(null, result);
			
			store.set(session, function(err, result){
				test.equal(null, err);
				test.equal(session, result);
				
				store.get(session.client_id, function(err, result){
					test.equal(null, err);
					test.deepEqual(session, result);
					test.done();
				});
			});
		});
	},
	
	testSetClear: function(test){
		var session = getSessionObject('abc'+Math.random());
		var store   = new MongoSessionStore();
		store.set(session, function(err, result){
			test.equal(null, err);
			test.equal(session, result);
			
			store.clear(session.client_id, function(err, result){
				test.equal(null, err);
				test.equal(1, result);
				
				test.done();
			});
		});
	},
	
	testTimeout: function(test){
		pb.config.session.timeout = 2000;
		
		var session = getSessionObject('abc'+Math.random());
		var store   = new MongoSessionStore();
		
		test.expect(4);
		store.set(session, function(err, result){
			test.equal(null, err);
			test.equal(session, result);
			
			pb.log.debug("MongoSessionStore::testTimeout - Waiting 31 seconds to ensure session expired");
			setTimeout(function(){
				
				store.get(session.client_id, function(err, result){
					test.equal(null, err);
					test.equal(null, result);
					test.done();
				});
			}, 31000);
		});
	}
};

function getSessionObject(sessionId){
	var timeout = new Date().getTime() + pb.config.session.timeout;
	return {
		uid: sessionId,
		client_id: sessionId,
		timeout: timeout,
		a: "a",
		b: "b",
	};
}
