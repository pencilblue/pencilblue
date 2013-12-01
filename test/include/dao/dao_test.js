/**
 * dao.js
 * 
 * @author Brian Hyder <brianhyder@gmail.com>
 * @copyright PencilBlue 2013, All Rights Reserved
 */

//requires
require('../../base_test');

process.on('uncaughtException', function(err) {
	  console.error(err.stack);
});

exports.query = function(test){
	var expectedId = '123456789012';
	var entityType = 'test_dao_collection';
	var where      = {
		_id: ObjectID(expectedId)
	};
	loadConfiguration(function(){
		dbm.getDB(MONGO_DATABASE).then(function(result){
			
			(new DAO()).query('setting').then(function(result){
				
				//start the shutdown sequence
				dbm.shutdown();
				
				var type = typeof result;console.log(JSON.stringify(result));
				//test.equals(result.databaseName, MONGO_DATABASE, "An error occurred connecting to the DB. TYPE=["+type+"] Expected: "+MONGO_DATABASE+" Actual: "+result);
				test.done();
			});
		});
	});
	
};