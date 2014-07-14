/**
 * cache_test.js
 * 
 * @author Brian Hyder <brianhyder@gmail.com>
 * @copyright PencilBlue 2014, All Rights Reserved
 */

//requires
require('../../../base_test');

module.exports = {
	
	setUp: function(cb){
		cb();
	},

	tearDown: function(cb){
		cb();
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
			var result = pb.UrlService.urlJoin.apply(pb.utils, tests[i].params);
			test.equal(result, tests[i].expected);
		}
		test.done();
	},
	
	testPattern: function(test) {
		var tests = [
            {
                val: '/media/hello',
                expected: true
            },
            {
                val: '/media/hello/',
                expected: true
            },
            {
                val: 'media/hello',
                expected: true
            },
            {
                val: 'media/hello/',
                expected: true
            },
            {
                val: '//media/hello/',
                expected: false,
            },
            {
                val: '//media/hello//',
                expected: false,
            },
            {
                val: '//media//hello/',
                expected: false,
            },

            {
                val: '/media/hello/m',
                expected: false,
            },
            {
                val: '/media/hello/media/hello/',
                expected: false,
            },
        ];
		
		var url = '/media/hello/';
		if (url.charAt(0) === '/') {
			url = url.substring(1);
		}
		if (url.charAt(url.length - 1) === '/') {
			url = url.substring(0, url.length - 1);
		}
		var pattern = "^\\/{0,1}" + pb.utils.escapeRegExp(url) + "\\/{0,1}$";
		for (var i = 0; i < tests.length; i++) {
			var regex = /^\/{0,1}media\/hello\/{0,1}$/;
			regex = new RegExp(pattern);//"^\\/{0,1}media\\/hello\\/{0,1}$");
			test.equals(regex.test(tests[i].val), tests[i].expected);
		}
		test.done();
	}
};
