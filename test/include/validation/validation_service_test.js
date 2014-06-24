/**
 * cache_test.js
 *
 * @author Brian Hyder <brianhyder@gmail.com>
 * @copyright PencilBlue 2014, All Rights Reserved
 */

//requires
require('../../base_test');

module.exports = {

	setUp: function(cb){
		cb();
	},

	tearDown: function(cb){
		cb();
	},

	testValidateUrl: function(test) {

		var tests = [
            {val: '/events', exp: true}
        ];

        for(var i = 0; i < tests.length; i++) {
            var actual = pb.validation.validateUrl(tests[i].val, true);
            test.equals(tests[i].exp, actual);
        }
        test.done();
	},
};
