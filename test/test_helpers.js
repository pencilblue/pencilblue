'use strict';

//dependencies
var Configuration = require('../include/config.js');
var Lib           = require('../lib');
var sinon = require('sinon');

/**
 * @class TestHelpers
 */
class TestHelpers {

    static registerReset(context) {

        before('Initialize the Environment with the default configuration', function () {
            this.timeout(10000);
            this.pb = new Lib(Configuration.getBaseConfig());
            if (context) {
                context(this.pb);
            }
        });
    };

    static registerSandbox () {
        var sandbox = sinon.sandbox.create();

        afterEach(function () {
            sandbox.restore();
        });
        return sandbox;
    }
}

module.exports = TestHelpers;
