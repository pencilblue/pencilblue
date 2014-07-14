/**
 * cache_test.js
 * 
 * @author Brian Hyder <brianhyder@gmail.com>
 * @copyright PencilBlue 2014, All Rights Reserved
 */

//requires
require('../../base_test');
var MongoSessionStore = require(DOCUMENT_ROOT+"/include/session/storage/mongo_session_store.js");

//constants
var DEFAULT_TIMEOUT = pb.config.session.timeout;

module.exports = {
	
	setUp: function(cb){
		cb();
	},

	tearDown: function(cb){
		cb();
	},
	
	testRegisterRoute: function(test){
		var tests = [
            {
            	path: '/setup',
            	controller: DOCUMENT_ROOT+'/controllers/setup.js',
            	url: 'http://localhost:8080/setup',
            	expect: true
            },
            {
            	path: '/setup/',
            	controller: DOCUMENT_ROOT+'/controllers/setup.js',
            	url: 'http://localhost:8080/setup',
            	expect: true
            },
            {
            	path: '/setup',
            	controller: DOCUMENT_ROOT+'/controllers/setup.js',
            	url: 'http://localhost:8080/setup/',
            	expect: true
            },
            {
            	path: '/setup/',
            	controller: DOCUMENT_ROOT+'/controllers/setup.js',
            	url: 'http://localhost:8080/setup/',
            	expect: true
            },
            {
            	path: '/',
            	controller: DOCUMENT_ROOT+'/controllers/setup.js',
            	url: 'http://localhost:8080/',
            	expect: true
            },
            {
            	path: '/',
            	controller: DOCUMENT_ROOT+'/controllers/setup.js',
            	url: 'http://localhost:8080',
            	expect: true
            },
            {
            	path: '/hello',
            	controller: DOCUMENT_ROOT+'/controllers/setup.js',
            	url: 'http://localhost:8080',
            	expect: false
            },
            {
            	path: '/:hello',
            	controller: DOCUMENT_ROOT+'/controllers/setup.js',
            	url: 'http://localhost:8080/world',
            	expect: true
            },
            {
            	path: '/:hello/what/up',
            	controller: DOCUMENT_ROOT+'/controllers/setup.js',
            	url: 'http://localhost:8080/world_donkey-kong/what/up/',
            	expect: true
            },
            {
            	path: '/public/:plugin/*',
            	controller: DOCUMENT_ROOT+'/controllers/setup.js',
            	url: 'http://localhost:8080/public/sample/test.jpg',
            	expect: true
            },
            {
            	path: '/public/:plugin/*',
            	controller: DOCUMENT_ROOT+'/controllers/setup.js',
            	url: 'http://localhost:8080/public/sample/imgs/test.jpg',
            	expect: true
            },
            {
            	path: '/public/:plugin/*',
            	controller: DOCUMENT_ROOT+'/controllers/setup.js',
            	url: 'http://localhost:8080/public/sample/js/homepage/rockstar.js',
            	expect: true
            }
        ];
		
		for (var i = 0; i < tests.length; i++) {
			pb.RequestHandler.storage = [];
			pb.RequestHandler.index   = {};
			
			
			var testcase = tests[i];
			var rh       = new pb.RequestHandler(null, {url: testcase.url}, null);
			var success  = pb.RequestHandler.registerRoute(testcase, pb.RequestHandler.DEFAULT_THEME);
			test.ok(success);
			var actual = rh.getRoute(rh.url.pathname);
			test.equal(testcase.expect, actual != null, util.format("Failed to assert that the result of path [%s] against url [%s]", testcase.path, testcase.url));
		}
		test.done();
	},
};
