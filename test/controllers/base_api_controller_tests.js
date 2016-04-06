
//dependencies
var should        = require('should');
var Configuration = require('../../include/config.js');
var Lib           = require('../../lib');

describe('BaseApiController', function() {

    var pb = null;
    var BaseApiController = null;
    before('Initialize the Environment with the default configuration', function () {
        this.timeout(10000);

        pb = new Lib(Configuration.getBaseConfig());
        BaseApiController = pb.BaseApiController;
    });

    describe('BaseApiController.notFound', function() {

        it('should callback with an error when provided a valid callback function', function(next) {
            var instance = new BaseApiController({});
            instance.notFound(function(err) {
                err.message.should.eql('NOT FOUND');
                err.code.should.eql(404);
                next();
            });
        });
    });

    describe('BaseApiController.processOrder', function() {

        [null, undefined, '', 1, 2.9, false].forEach(function(valToTest) {

            it('should skip processing when the order query is: '+valToTest, function() {
                var instance = new BaseApiController({});
                var result = instance.processOrder(valToTest);
                should.equal(result.order, null);
                result.failures.should.eql([]);
            });
        });

        it('should process the order an indicate publish date descending and headline ascending', function() {
            var instance = new BaseApiController({});
            var valToTest = 'publish_date=-1,headline=1';
            var result = instance.processOrder(valToTest);
            result.order.should.eql([['publish_date', -1], ['headline', 1]]);
            result.failures.should.eql([]);
        });
    });
});
