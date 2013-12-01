/**
 * Base test class that all other test files should require
 * 
 * @author Brian Hyder <brianhyder@gmail.com>
 * @copyright PencilBlue 2013, All rights reserved
 */
require('../include/requirements');

//exception handler
//TODO Figure out how to bail out and still fail the test.  Currently the 
//process just stops without reporting back.  Might be able to make the test 
//object global or there may already be a method for this.
process.on('uncaughtException', function(err) {
    // handle the error safely
	console.log('An Uncaught Error Occurred:');
    console.log(err.stack);
    process.abort();
});