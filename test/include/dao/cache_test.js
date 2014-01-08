/**
 * cache_test.js
 * 
 * @author Brian Hyder <brianhyder@gmail.com>
 * @copyright PencilBlue 2014, All Rights Reserved
 */

//requires
require('../../base_test');

//constants
var TEST_COLLECTION = 'test_collection';

module.exports = {
	
	setUp: function(cb){
		cb();
	},

	tearDown: function(cb){
		cb();
	},
	
	testSetGet: function(test){
		var expectedKey   = "some_test_key";
		var expectedValue = "hello world";
		
		test.expect(4);
		pb.cache.set(expectedKey, expectedValue, function(err, result){
			test.equals(null, err);
			test.equals('OK', result);
			
			pb.cache.get(expectedKey, function(err, result){
				test.equals(null, err);
				test.equals(expectedValue, result);
				test.done();
			});
		});
	},
	
	testSetExpiry: function(test){
		var expectedKey   = "some_test_key";
		var expectedValue = "hello world";
		
		test.expect(4);
		pb.cache.setex(expectedKey, 300, expectedValue, function(err, result){
			test.equals(null, err);
			test.equals('OK', result);
			
			pb.cache.get(expectedKey, function(err, result){
				test.equals(null, err);
				test.equals(expectedValue, result);
				test.done();
			});
		});
	},
};
