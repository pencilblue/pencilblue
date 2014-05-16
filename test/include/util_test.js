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
	
	testUrlJoin: function(test) {
		var tests = [
           {
        	   params: ['/', '\\media\\', '14\\5\\33456789.jpg'],
        	   expected: '/media/14/5/33456789.jpg'
           },
           {
        	   params: ['\\media\\', '14\\5\\33456789.jpg'],
        	   expected: '/media/14/5/33456789.jpg'
           }
        ];
		
		for (var i = 0; i < tests.length; i++) {
			var result = pb.utils.urlJoin.apply(pb.utils, tests[i].params);
			test.equal(result, tests[i].expected);
		}
		test.done();
	},
};
