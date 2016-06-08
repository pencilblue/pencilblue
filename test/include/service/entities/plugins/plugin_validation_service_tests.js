
//dependencies
var should = require('should');
var Configuration = require('../../../../../include/config.js');
var Lib           = require('../../../../../lib');

describe('PluginValidationService', function() {

    var pb = null;
    var PluginValidationService = null;
    before('Initialize the Environment with the default configuration', function () {
        this.timeout(10000);

        pb = new Lib(Configuration.getBaseConfig());
        PluginValidationService = pb.PluginValidationService;
    });

    describe('PluginValidationService.validateSettingValue', function() {

        [1, 2.0, true, false, '', 'hello'].forEach(function(val) {

            it('should return true when passed a value type of '+(typeof val), function() {
                PluginValidationService.validateSettingValue(val).should.eql(true);
            });
        });
    });
});
