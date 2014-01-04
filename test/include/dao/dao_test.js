/**
 * dao.js
 * 
 * @author Brian Hyder <brianhyder@gmail.com>
 * @copyright PencilBlue 2013, All Rights Reserved
 */

//requires
require('../../base_test');

//constants
var TEST_COLLECTION = 'test_collection';

module.exports = {
	
	setUp: function(cb){
		async.series({
			dropCollection: function(callback){
				pb.dbm.getDB().then(function(result){
					result.dropCollection(TEST_COLLECTION, function(err, result){
						if(err){
							console.log('WARNING: Could not drop collection ['+TEST_COLLECTION+']: '+err);
						}
						callback(null, result);
					});
				});
			},
			createCollection: function(callback){
				pb.dbm.getDB().then(function(result){
					result.createCollection(TEST_COLLECTION, {}, callback);
				});
			}
		}, 
		function(err, result){
			if(err){
				throw err;
			}
			cb();
		});
	},

	tearDown: function(cb){
		cb();
	},
	
	testSimpleQuery: function(test){
		pb.dbm.getDB().then(function(result){
			
			(new pb.DAO()).query(TEST_COLLECTION).then(function(result){
				
				//start the shutdown sequence
				pb.dbm.shutdown();
				
				//TODO actually test for setting
				test.done();
			});
		});
	},
	
	testOrderByQuery: function(test){
		pb.dbm.getDB().then(function(result){
			var dao = new pb.DAO();
			async.series([
	                function(callback){
	                	var expected = {
	            			object_type: TEST_COLLECTION,
	            			key: "testOrderByQuery3",
	            			value: "3",
	                	};
	                	dao.insert(expected).then(function(result){
	                		callback(null, result);
	                	});
	                },
	                function(callback){
	                	var expected = {
	            			object_type: TEST_COLLECTION,
	            			key: "testOrderByQuery1",
	            			value: "1",
	                	};
	                	dao.insert(expected).then(function(result){
	                		callback(typeof result == 'Error' ? result : null, result);
	                	});
	                },
	                function(callback){
	                	var expected = {
	            			object_type: TEST_COLLECTION,
	            			key: "testOrderByQuery2",
	            			value: "2",
	                	};
	                	dao.insert(expected).then(function(result){
	                		callback(null, result);
	                	});
	                }
	            ], 
	            function(err, result){
					test.equals(null, err);
					
					var orderBy = [['key', pb.DAO.ASC]];
					dao.query(TEST_COLLECTION, pb.DAO.ANYWHERE, pb.DAO.PROJECT_ALL, orderBy).then(function(result){
						
						//start the shutdown sequence
						pb.dbm.shutdown();
						
						test.equals('testOrderByQuery1', result[0]['key']);
						test.equals('testOrderByQuery2', result[1]['key']);
						test.equals('testOrderByQuery3', result[2]['key']);
						test.done();
					});
				}
			);
		});
	},
	
	testDeleteById: function(test){
		var expectedId = '123456789012';
		var collection = 'setting';
		pb.dbm.getDB().then(function(result){
			
			(new pb.DAO()).deleteById(expectedId, collection).then(function(result){
				
				//start the shutdown sequence
				pb.dbm.shutdown();
				
				test.equals(0, result);
				test.done();
			});
		});
	},
	
	testInsert: function(test){
		var expected = {
				object_type: "setting",
				key: "unit_test_insert",
				value: "some value",
		};
		pb.dbm.getDB().then(function(result){
			(new pb.DAO()).insert(expected).then(function(result){
				
				//start the shutdown sequence
				pb.dbm.shutdown();
				
				//evaluate test
				test.notEqual(result._id, undefined);
				test.notEqual(result._id, null);
				test.equal(expected.object_type, result.object_type);
				test.equal(expected.key, result.key);
				test.equal(expected.value, result.value);
				test.done();
			});
		});
	},
	
	testUpdate: function(test){
		var expected = {
				object_type: "setting",
				key: "unit_test_update",
				value: "some value",
		};
		pb.dbm.getDB().then(function(result){
			var dao = new pb.DAO();
			dao.insert(expected).then(function(result){
				
				result.value = "some value 2";
				dao.update(result).then(function(uresult){
					
					//start the shutdown sequence
					pb.dbm.shutdown();
					
					//evaluate test
					console.log("UPDATE: "+JSON.stringify(uresult));
					test.equal(1, uresult);
					test.done();
				});
			});
		});
	}
};
