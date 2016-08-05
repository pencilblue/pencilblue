
//dependencies
var should = require('should');
var Configuration = require('../../../../../include/config.js');
var Lib           = require('../../../../../lib');

describe('BowerPluginDependencyService', function() {

    var pb = null;
    var BowerPluginDependencyService = null;
    before('Initialize the Environment with the default configuration', function () {
        this.timeout(10000);

        pb = new Lib(Configuration.getBaseConfig());
        BowerPluginDependencyService = pb.BowerPluginDependencyService;
    });

    describe('BowerPluginDependencyService.getType', function() {

        it('should return bower', function() {
            var service = new BowerPluginDependencyService({});
            service.getType().should.eql('bower');
        });
    });

    describe('BowerPluginDependencyService.getRootPathToBowerJson', function() {

        it('should return the path bower_components directory under the installation directory', function() {
            BowerPluginDependencyService.getRootPathToBowerJson('bootstrap').length.should.be.greaterThan(0);
        });
    });

    describe('BowerPluginDependencyService.getPluginPathToBowerJson', function() {

        it('should return the path bower_components directory under the installation directory', function() {
            BowerPluginDependencyService.getPluginPathToBowerJson('sample', 'bootstrap').length.should.be.greaterThan(0);
        });
    });
});
