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
var DEFAULT_TIMEOUT    = pb.config.session.timeout;
var DEFAULT_SESS_STORE = null;

module.exports = {
	
	setUp: function(cb){
		pb.dbm.getDB().then(function(result){
			cb();
		});
		DEFAULT_SESSION_STORE = pb.config.session.storage;
	},

	tearDown: function(cb){
		pb.utils.onPromisesOk(pb.dbm.shutdown(), cb);
		pb.config.session.storage = DEFAULT_SESSION_STORE;
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
	},
	
	testCreate: function(test) {
		var expectedSID = '3be37ae36dcb25aba8244e7214f2c46ba15f11e0560910a479815ab6c0eef4d231179c42e65968da2197fc8890e43466c7be23b8a6ec2c1993c535cd2a3bc76a';
		var expectedIP  = '10.1.1.1';
		
		var request = {
			connection: {
				remoteAddress: expectedIP
			},
			headers: {
	            "user-agent": 'some test user agent'
			}
		};
		var session = pb.session.create(request);
		
		test.equal(expectedSID, session.client_id);
		test.equal(expectedIP, session.ip);
		test.equal(null, session.authentication.user_id);
		test.deepEqual([], session.authentication.permissions);
		test.ok(session.uid != null);
		test.done();
	},
	
	testIsLocalSIDExists: function(test) {
		var sid     = 'test-session-id';
		var handler = new SessionHandler();
		handler.localStorage[sid] = {};
		
		var actual = handler.isLocal(sid);
		test.ok(actual);
		test.done();
	},
	
	testIsLocalSIDNonExistent: function(test) {
		var sid     = 'test-session-id';
		var handler = new SessionHandler();
		
		var actual = handler.isLocal(sid);
		test.ok(!actual);
		test.done();
	},
	
	testPurgeLocalUnopenedSession: function(test) {
		var sid = null;
		var handler = new SessionHandler();
		try{
			handler.purgeLocal(sid);
			test.fail("SessionHandler::purgeLocal failed to check for an empty session id");
		}
		catch(e){
			//expected exception
		}
		test.done();
	},
	
	testPurgeLocalDoesNotQualify: function(test) {
		var sid            = 'non-qualifying-sid';
		var sessionWrapper = {
			request_count: 2,
			session: {
				uid: sid
			}
		};
		var handler = new SessionHandler();
		handler.localStorage[sid] = sessionWrapper;
		var actual = handler.purgeLocal(sid);
		
		test.ok(!actual);
		test.equal(1, handler.localStorage[sid].request_count);
		test.done();
	},
	
	testPurgeLocalDoesQualify: function(test) {
		var sid            = 'qualifying-sid';
		var sessionWrapper = {
			request_count: 1,
			session: {
				uid: sid
			}
		};
		var handler = new SessionHandler();
		handler.localStorage[sid] = sessionWrapper;
		var actual = handler.purgeLocal(sid);
		
		test.ok(actual);
		test.equal(undefined, handler.localStorage[sid]);
		test.done();
	},
	
	testSetLocal: function(test) {
		var sid = 'abc';
		var session = {
			uid: sid	
		};
		var handler = new SessionHandler();
		handler.setLocal(session);
		
		test.equal(1, handler.localStorage[sid].request_count);
		test.equal(sid, handler.localStorage[sid].session.uid);
		
		handler.setLocal(session);
		test.equal(2, handler.localStorage[sid].request_count);
		test.equal(sid, handler.localStorage[sid].session.uid);
		test.done();
	},
	
	testGlNotLocal: function(test) {
		var sid     = 'non-existent';
		var handler = new SessionHandler();
		var result = handler.gl(sid);
		test.equal(null, result);
		test.done();
	},
	
	testGl: function(test) {
		var sid     = 'some-existing-sid';
		var session = {
			uid: sid	
		};
		var sessionWrapper = {
			session: session
		};
		var handler = new SessionHandler();
		handler.localStorage[sid] = sessionWrapper;
		
		var result = handler.gl(sid);
		test.deepEqual(session, result);
		test.done();
	},
	
	testCloseUnopenedSession: function(test){
		var session = {
			uid: 'abc'	
		};
		var handler = new SessionHandler();
		try{
			handler.close(session, null);
			test.fail("SessionHandler should have thrown exception");
		}
		catch(e){
			//expected exception
			pb.log.debug(JSON.stringify(e));
		}
		test.done();
	},
	
	testCloseNullSession: function(test){
		var session = null;
		var handler = new SessionHandler();
		try{
			handler.close(session, null);
			test.fail("SessionHandler should have thrown exception");
		}
		catch(e){
			//expected exception
			pb.log.debug(JSON.stringify(e));
		}
		test.done();
	},
	
	testCloseById: function(test){
		var sid     = 'some-session-id';
		var session = {
			uid: sid
		};
		var handler = new SessionHandler();
		handler.setLocal(session);
		handler.close(sid, function(err, result){
			
			test.equal(null, err);
			test.equal(null, handler.gl(sid));
			test.done();
		});
	},
	
	testCloseByObject: function(test){
		var sid     = 'some-session-id';
		var session = {
			uid: sid
		};
		var handler = new SessionHandler();
		handler.setLocal(session);
		handler.close(session, function(err, result){
			
			test.equal(null, err);
			test.equal(null, handler.gl(sid));
			test.done();
		});
	},
	
	testCloseByObjectMultipleRequests: function(test){
		var sid     = 'some-session-id';
		var session = {
			uid: sid
		};
		var handler = new SessionHandler();
		handler.setLocal(session);
		handler.setLocal(session);
		handler.close(session, function(err, result){
			
			test.equal(null, err);
			test.equal(session, handler.gl(sid));
			test.done();
		});
	},
	
	testOpenNoCookie: function(test){
		var request = {
			headers: {
				parsed_cookies: {}
			},
			connection: {
				remoteAddress: '10.1.1.12'
			}
		};
		var handler = new SessionHandler();
		handler.open(request, function(err, result){
		
			test.equal(null, err);
			test.ok(result.uid);
			test.equal(1, handler.localStorage[result.uid].request_count);
			test.done();
		});
	},
	
	testOpenCreateNotInStorage: function(test){
		var sid     = 'abc123|'+Math.random();
		var request = {
			headers: {
				parsed_cookies: {
					session_id: sid
				}
			},
			connection: {
				remoteAddress: '10.1.1.12'
			}
		};
		var handler = new SessionHandler();
		handler.open(request, function(err, result){
		
			test.equal(null, err);
			test.notEqual(sid, result.uid);
			test.equal(1, handler.localStorage[result.uid].request_count);
			test.done();
		});
	},
	
	testOpenFromStorage: function(test){
		var sid     = 'abc123|'+Math.random();
		var session = {
			uid: sid,
			timeout: new Date().getTime() + 6000
		};
		var request = {
			headers: {
				parsed_cookies: {
					session_id: sid
				}
			}
		};
		var handler = new SessionHandler();
		handler.sessionStore.set(session, function(err, result){
			test.equal(null, err);
			
			handler.open(request, function(err, result){
			
				test.equal(null, err);
				test.deepEqual(session, result);
				test.equal(1, handler.localStorage[sid].request_count);
				test.done();
			});
		});
	},
	
	testOpenFromLocalStorage: function(test){
		var sid     = 'abc123';
		var session = {
			uid: sid
		};
		var wrapper = {
			request_count: 1,
			session: session
		};
		var request = {
			headers: {
				parsed_cookies: {
					session_id: sid
				}
			}
		};
		var handler               = new SessionHandler();
		handler.localStorage[sid] = wrapper;
		handler.open(request, function(err, result){
			
			test.equal(null, err);
			test.equal(session, result);
			test.equal(2, handler.localStorage[sid].request_count);
			test.done();
		});
	},
};
