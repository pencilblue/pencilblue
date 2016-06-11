'use strict';

//dependencies
var should = require('should');
var TestHelpers = require('../../../../../test_helpers.js');

describe('PluginResourceLoader', function() {

    TestHelpers.registerReset();

    describe('PluginResourceLoader.getResourceName', function() {

        it('should throw when called with an invalid path and service', function() {
            this.pb.PluginResourceLoader.getResourceName.bind(null, null).should.throwError();
        });
    });
});
