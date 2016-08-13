'use strict';

//dependencies
var should = require('should');
var TestHelpers = require('../../../../../test_helpers.js');

describe('PluginLocalizationLoader', function() {

    TestHelpers.registerReset();

    describe('PluginLocalizationLoader.getPathToLocalizations', function() {

        it('should throw when called with an invalid plugin UID', function() {
            this.pb.PluginLocalizationLoader.getPathToLocalizations.bind(null, null).should.throwError();
        });
    });
});
