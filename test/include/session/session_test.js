/**
 * session_test.js
 * 
 * @author Brian Hyder <brianhyder@gmail.com>
 * @copyright PencilBlue 2014, All Rights Reserved
 */

//requires
require('../../base_test');

//types
var SessionHandler = pb.SessionHandler;

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
	
	testGetSessionIdFromCookieBadSID: function(test){
		var request = {
			headers: {}
		};
		request.headers[SessionHandler.COOKIE_HEADER] = {
			'abc' : '123'
		};
		var sid = pb.SessionHandler.getSessionIdFromCookie(request);
		test.equal(null, sid);
		test.done();
	},
	
	testGetSessionIdFromCookieNoCookieHeader: function(test){
		var request = {
			headers: {}
		};;
		var sid = SessionHandler.getSessionIdFromCookie(request);
		test.equal(null, sid);
		test.done();
	},
	
	testGetSessionIdFromCookieBadTrailingWhitespace: function(test){
		var expected = '123';
		var request  = {
			headers: {}
		};
		request.headers[SessionHandler.COOKIE_HEADER] = {
			'session_id   ' : expected
		};
		var sid = pb.SessionHandler.getSessionIdFromCookie(request);
		test.equal(expected, sid);
		test.done();
	},
	
	testGetSessionStoreRedis: function(test){
		pb.config.session.storage = 'redis';
		var store = SessionHandler.getSessionStore();
		test.ok(store != null);
		test.done();
	},
	
	testGetSessionStoreMongo: function(test){
		pb.config.session.storage = 'mongo';
		var store = SessionHandler.getSessionStore();
		test.ok(store != null);
		test.done();
	},
	
	testGetSessionStoreByPath: function(test){
		pb.config.session.storage = path.join(DOCUMENT_ROOT, 'include', 'session', 'storage', 'mongo_session_store.js');
		var store = SessionHandler.getSessionStore();
		test.ok(store != null);
		test.done();
	},
	
	testGetSessionStoreBadPath: function(test){
		pb.config.session.storage = path.join(DOCUMENT_ROOT, 'include', 'session', 'storage', 'mysql_session_store.js');
		try {
			SessionHandler.getSessionStore();
			test.fail("The call SessionHandler.getSessionStore was expected to throw an exception");
		}
		catch(e){
			//expected exception
		}
		test.done();
	}
};
