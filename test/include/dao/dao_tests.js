
//dependencies
var ObjectID      = require('mongodb').ObjectID;
var should        = require('should');
var Configuration = require('../../../include/config.js');
var Lib           = require('../../../lib');

describe('DAO', function() {

    var pb = null;
    var DAO = null;
    before('Initialize the Environment with the default configuration', function () {
        this.timeout(10000);

        pb = new Lib(Configuration.getBaseConfig());
        DAO = pb.DAO;
    });

    describe('DAO.mapSimpleIdField', function() {

        it('should throw when passed null as the parameter', function() {
            DAO.mapSimpleIdField.bind(null, null).should.throwError();
        });

        it('should throw when passed undefined as the parameter', function() {
            DAO.mapSimpleIdField.bind(null, undefined).should.throwError();
        });

        it('should set the id field from the _id field', function() {
            var doc = {
                _id: 'hello_world'
            };
            DAO.mapSimpleIdField(doc);
            doc.id.should.eql(doc._id);
        });
    });

    describe('DAO.getIdField', function() {

        it('should return _id', function() {
            DAO.getIdField().should.eql('_id');
        })
    });

    describe('DAO.areIdsEqual', function() {

        it('should throw when passed null as the first parameter', function() {
            DAO.areIdsEqual.bind(null, null, 1).should.throwError();
        });

        it('should throw when passed undefined as the first parameter', function() {
            DAO.areIdsEqual.bind(null, undefined, 1).should.throwError();
        });

        it('should throw when passed null as the second parameter', function() {
            DAO.areIdsEqual.bind(null, 1, null).should.throwError();
        });

        it('should throw when passed undefined as the second parameter', function() {
            DAO.areIdsEqual.bind(null, 1, undefined).should.throwError();
        });

        it('should return true when the IDs are strings and equivalent', function() {
            DAO.areIdsEqual('1', '1').should.be.ok;
        });

        it('should return true when the IDs are ObjectIDs and equivalent', function() {
            var id1 = new ObjectID();
            var id2 = id1;
            DAO.areIdsEqual(id1, id2).should.be.ok;
        });

        it('should return true when one id is an ObjectID and the other is a string and equivalent', function() {
            var id1 = new ObjectID();
            var id2 = id1.toString();
            DAO.areIdsEqual(id1, id2).should.be.ok;
        });
    });
});
