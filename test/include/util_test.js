/**
 * cache_test.js
 * 
 * @author Brian Hyder <brianhyder@gmail.com>
 * @copyright PencilBlue 2014, All Rights Reserved
 */

//requires
require('../base_test');

module.exports = {
	
	setUp: function(cb){
		cb();
	},

	tearDown: function(cb){
		cb();
	},
	
	testGetDirectories: function(test) {
		
		pb.utils.getDirectories(path.join(DOCUMENT_ROOT, 'plugins', 'sample'), function(err, dirs) {
			test.ok(err == null);
			test.ok(util.isArray(dirs));
			test.equal(dirs.length, 4);
			test.done();
		});
	},
};
