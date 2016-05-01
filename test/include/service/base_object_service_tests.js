
//dependencies
var should        = require('should');
var Configuration = require('../../../include/config.js');
var Lib           = require('../../../lib');

describe('BaseObjectService', function() {

    var pb = null;
    var BaseObjectService = null;
    before('Initialize the Environment with the default configuration', function () {
        this.timeout(10000);

        pb = new Lib(Configuration.getBaseConfig());
        BaseObjectService = pb.BaseObjectService;
    });

    describe('BaseObjectService.getIdWhere', function () {

        it('should throw when passed null as the parameter', function() {
            var instance = new BaseObjectService({type: 'test'});
            instance.getIdWhere.bind(null, null).should.throwError();
        });

        it('should throw when passed undefined as the parameter', function() {
            var instance = new BaseObjectService({type: 'test'});
            instance.getIdWhere.bind(null, undefined).should.throwError();
        });

        it('should return null when and ID value is not provided in the DTO', function() {
            var dto = {};
            var instance = new BaseObjectService({type: 'test'});
            instance.getIdWhere(dto);
        });

        it('should return the ID value when it is provided in the DTO via the _id field', function() {
            var dto = { _id: 'abc' };
            var instance = new BaseObjectService({type: 'test'});
            instance.getIdWhere(dto).should.eql({_id: 'abc'});
        });

        it('should return the ID value when it is provided in the DTO via the id field', function() {
            var dto = { id: 'abc' };
            var instance = new BaseObjectService({type: 'test'});
            instance.getIdWhere(dto).should.eql({_id: 'abc'});
        });
    });

    describe('BaseObjectService.parseBoolean', function () {

        ['1', true, 1].forEach(function(val) {

            it('should return true when passed ' +val + ' as the parameter', function() {
                BaseObjectService.parseBoolean(val).should.eql(true);
            });
        });

        ['0', false, 0, 1.1, 2.2, -1, null, undefined].forEach(function(val) {

            it('should return false when passed ' +val + ' as the parameter', function() {
                BaseObjectService.parseBoolean(val).should.eql(false);
            });
        });
    })

});
