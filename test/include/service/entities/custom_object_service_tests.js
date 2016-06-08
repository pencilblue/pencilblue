
//dependencies
var should = require('should');
var Configuration = require('../../../../include/config.js');
var Lib           = require('../../../../lib');

describe('CustomObjectService', function() {

    var pb = null;
    var CustomObjectService = null;
    before('Initialize the Environment with the default configuration', function () {
        this.timeout(10000);

        pb = new Lib(Configuration.getBaseConfig());
        CustomObjectService = pb.CustomObjectService;
    });

    describe('CustomObjectService.getFieldTypes', function() {

        it('should return an array', function() {
            CustomObjectService.getFieldTypes().should.be.an.Array;
        });
    });
});
