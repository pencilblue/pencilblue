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

	dbmanager.getDB(MONGO_DATABASE).then(function(result){
		
		//start the shutdown sequence
		dbmanager.shutdown();
		
		var type = typeof result;
		test.equals(result.databaseName, MONGO_DATABASE, "An error occurred connecting to the DB. TYPE=["+type+"]");
		test.done();
	});
};