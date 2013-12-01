/**
 * DBManager Test
 * 
 * @author Brian Hyder <brianhyder@gmail.com>
 * @copyright PencilBlue 2013, All Rights Reserved
 */

//requires
require('../../base_test');


/**
 * @group medium
 */
exports.testGetDB = function(test){
	loadConfiguration(function(){
		dbm.getDB(MONGO_DATABASE).then(function(result){
			
			//start the shutdown sequence
			dbm.shutdown();
			
			var type = typeof result;
			test.equals(result.databaseName, MONGO_DATABASE, "An error occurred connecting to the DB. TYPE=["+type+"] Expected: "+MONGO_DATABASE+" Actual: "+result);
			test.done();
		});
	});
};