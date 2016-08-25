
//dependencies
var should = require('should');
var Configuration = require('../../../../../include/config.js');
var Lib           = require('../../../../../lib');

describe('NpmPluginDependencyService', function() {

    var pb = null;
    var NpmPluginDependencyService = null;
    before('Initialize the Environment with the default configuration', function () {
        this.timeout(10000);

        pb = new Lib(Configuration.getBaseConfig());
        NpmPluginDependencyService = pb.NpmPluginDependencyService;
    });

    describe('NpmPluginDependencyService.getType', function() {

        it('should return npm', function() {
            var service = new NpmPluginDependencyService({});
            service.getType().should.eql('npm');
        });
    });

    describe('NpmPluginDependencyService.getRootPathToPackageJson', function() {

        it('should return the path bower_components directory under the installation directory', function() {
            NpmPluginDependencyService.getRootPathToPackageJson('npm').length.should.be.greaterThan(0);
        });
    });

    describe('NpmPluginDependencyService.getPluginPathToPackageJson', function() {

        it('should return the path bower_components directory under the installation directory', function() {
            NpmPluginDependencyService.getPluginPathToPackageJson('sample', 'npm').length.should.be.greaterThan(0);
        });
    });
});
