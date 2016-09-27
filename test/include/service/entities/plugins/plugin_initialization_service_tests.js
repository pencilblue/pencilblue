
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

            pb.PluginService.deactivatePlugin(plugin.uid, plugin.site).should.eql(false);
        });
    });

    describe('PluginInitializationService.buildNoActionOnCachedTask', function() {

        it('should create an empty task when the plugin is cached', function(done) {

            var context = {
                cachedPlugin: {}
            };
            var taskSpec = PluginInitializationService.buildNoActionOnCachedTask(context, ['firstTask'], function(callback, results) {
                throw new Error('this should not be called');
            });

            taskSpec.length.should.eql(2);
            taskSpec[1](function(err, results) {
                should(err).eql(undefined);
                should(results).eql(undefined);
                done();
            }, null);
        });

        it('should execute the provided task because the plugin is not cached', function(done) {

            var context = {
                cachedPlugin: null
            };
            var taskSpec = PluginInitializationService.buildNoActionOnCachedTask(context, ['firstTask'], function(callback, results) {
                callback(null, 1);
            });

            taskSpec.length.should.eql(2);
            taskSpec[1](function(err, results) {
                should(err).eql(null);
                results.should.eql(1);
                done();
            }, null);
        });
    });
});
