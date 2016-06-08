'use strict';

//dependencies
var should = require('should');
var TestHelpers = require('../../../../../test_helpers.js');

describe('PluginServiceLoader', function() {

    TestHelpers.registerReset();

    describe('PluginServiceLoader.getServiceName', function() {

        it('should throw when called without a valid path to the resource', function() {
            this.pb.PluginServiceLoader.getServiceName.bind(null, null, null).should.throwError();
        });
    });
});
