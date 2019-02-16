
//dependencies
var should = require('should');
var Configuration = require('../../../../../include/config.js');
var Lib           = require('../../../../../lib');

describe('PluginInitializationService', function() {

    var pb = null;
    var PluginInitializationService = null;
    before('Initialize the Environment with the default configuration', function () {

        pb = new Lib(Configuration.getBaseConfig());
        PluginInitializationService = pb.PluginInitializationService;
    });

    describe('PluginInitializationService.validateSettingValue', function() {

        it('should deactivate the plugin and log validation errors', function() {

            //setup the active plugin to deactivate
            var pluginSpec = {};
            pb.PluginService.activatePlugin('some-plugin', pluginSpec, 'some-site').should.eql(true);

            var plugin = {
                site: 'some-site',
                uid: 'some-plugin'
            };
            var err = new Error('hey, something happened');
            err.validationErrors = [
                pb.BaseObjectService.validationFailure('a', 'b', 'c')
            ];
            PluginInitializationService.handleInitializationError(plugin, err);
        });
    });
});
