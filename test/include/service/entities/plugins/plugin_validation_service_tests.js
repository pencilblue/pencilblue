
//dependencies
var util = require('util');
var should = require('should');
var TestHelpers = require('../../../../test_helpers.js');

describe('PluginValidationService', function() {

    TestHelpers.registerReset();

    describe('PluginValidationService.validateSettingValue', function() {

        [1, 2.0, true, false, '', 'hello'].forEach(function(val) {

            it('should return true when passed a value type of '+(typeof val), function() {
                this.pb.PluginValidationService.validateSettingValue(val).should.eql(true);
            });
        });
    });

    describe('PluginValidationService.validateSetting', function() {

        [1, 2.0, true, false, '', 'hello'].forEach(function(val) {

            it('should callback with a validation error when not passed an object as the setting with value: '+(typeof val), function(done) {
                var service = new this.pb.PluginValidationService();
                service.validateSetting(val, {}, function(err, validationError) {
                    validationError.should.be.type('object');
                    done();
                });
            });
        });

        [1, 2.0, true, {}, []].forEach(function(val) {

            it('should callback with a validation error when the group is provided and not a non-empty string: '+util.inspect(val), function(done) {
                var service = new this.pb.PluginValidationService();
                service.validateSetting({group: val, name: 'abc', value: '123'}, {index: 0}, function(err, validationErrors) {
                    validationErrors.length.should.eql(1);
                    validationErrors[0].field.should.eql('settings[0].group');
                    done();
                });
            });
        });
    });
});
