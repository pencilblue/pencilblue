'use strict';

//dependencies
var should = require('should');
var TestHelpers = require('../../../../../test_helpers.js');

describe('PluginControllerLoader', function() {

    TestHelpers.registerReset();

    describe('PluginControllerLoader.getPathToControllers', function() {

        it('should throw when called with an invalid plugin UID', function() {
            this.pb.PluginControllerLoader.getPathToControllers.bind(null, null).should.throwError();
        });
    });
});
