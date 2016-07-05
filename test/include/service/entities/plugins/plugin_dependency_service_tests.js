
//dependencies
var should = require('should');
var Configuration = require('../../../../../include/config.js');
var Lib           = require('../../../../../lib');

describe('PluginDependencyService', function() {

    var pb = null;
    var PluginDependencyService = null;
    before('Initialize the Environment with the default configuration', function () {
        this.timeout(10000);

        pb = new Lib(Configuration.getBaseConfig());
        PluginDependencyService = pb.PluginDependencyService;
    });

    describe('PluginDependencyService.getType', function() {

        it('should throw when called directly', function() {
            var service = new PluginDependencyService({});
            service.getType.bind(service).should.throwError();
        });
    });

    describe('PluginDependencyService.isSatisfied', function() {

        it('should throw when called directly', function() {
            var service = new PluginDependencyService({});
            service.isSatisfied.bind(service).should.throwError();
        });
    });

    describe('PluginDependencyService.hasDependencies', function() {

        it('should throw when called directly', function() {
            var service = new PluginDependencyService({});
            service.hasDependencies.bind(service).should.throwError();
        });
    });

    describe('PluginDependencyService._installAll', function() {

        it('should throw when called directly', function() {
            var service = new PluginDependencyService({});
            service._installAll.bind(service).should.throwError();
        });
    });

    describe('PluginDependencyService._install', function() {

        it('should throw when called directly', function() {
            var service = new PluginDependencyService({});
            service._install.bind(service).should.throwError();
        });
    });

    describe('PluginDependencyService.getLockKey', function() {

        it('should postfix the key with the type and plugin uid', function() {
            PluginDependencyService.getLockKey('test1', 'pluginX').should.containEql(':pluginX:test1:dependency:install');
        });
    });

    describe('PluginDependencyService.buildResult', function() {

        it('should provide an object with a result and any validation errors', function() {
            PluginDependencyService.buildResult(true, [{a: '1'}]).should.eql({ success: true, validationErrors: [{a: '1'}]});
        });
    });
});
