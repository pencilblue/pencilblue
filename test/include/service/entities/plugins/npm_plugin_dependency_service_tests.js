
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

        it('should throw when called directly', function() {
            var service = new NpmPluginDependencyService({});
            service.getType().should.eql('npm');
        });
    });
});
