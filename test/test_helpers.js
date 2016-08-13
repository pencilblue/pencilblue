'use strict';

//dependencies
var Configuration = require('../include/config.js');
var Lib           = require('../lib');

/**
 * @class TestHelpers
 * @constructor
 */
function TestHelpers(){}

TestHelpers.registerReset = function(context) {

    before('Initialize the Environment with the default configuration', function () {
        this.timeout(10000);
        this.pb = new Lib(Configuration.getBaseConfig());
        if (context) {
            context(this.pb);
        }
    });
};

module.exports = TestHelpers;
