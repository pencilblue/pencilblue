
//dependencies
var ObjectID    = require('mongodb').ObjectID;
var should      = require('should');
var TestHelpers = require('../../test_helpers');

describe('DAO', function() {

    TestHelpers.registerReset();

    describe('mapSimpleIdField', function() {

        it('should throw when passed null as the parameter', function() {
            this.pb.DAO.mapSimpleIdField.bind(null, null).should.throwError();
        });

        it('should throw when passed undefined as the parameter', function() {
            this.pb.DAO.mapSimpleIdField.bind(null, undefined).should.throwError();
        });

        it('should set the id field from the _id field', function() {
            var doc = {
                _id: 'hello_world'
            };
            this.pb.DAO.mapSimpleIdField(doc);
            doc.id.should.eql(doc._id);
        });
    });

    describe('getIdField', function() {

        it('should return _id', function() {
            this.pb.DAO.getIdField().should.eql('_id');
        });
    });

    describe('areIdsEqual', function() {

        it('should throw when passed null as the first parameter', function() {
            this.pb.DAO.areIdsEqual.bind(null, null, 1).should.throwError();
        });

        it('should throw when passed undefined as the first parameter', function() {
            this.pb.DAO.areIdsEqual.bind(null, undefined, 1).should.throwError();
        });

        it('should throw when passed null as the second parameter', function() {
            this.pb.DAO.areIdsEqual.bind(null, 1, null).should.throwError();
        });

        it('should throw when passed undefined as the second parameter', function() {
            this.pb.DAO.areIdsEqual.bind(null, 1, undefined).should.throwError();
        });

        it('should return true when the IDs are strings and equivalent', function() {
            this.pb.DAO.areIdsEqual('1', '1').should.be.ok();
        });

        it('should return true when the IDs are ObjectIDs and equivalent', function() {
            var id1 = new ObjectID();
            var id2 = id1;
            this.pb.DAO.areIdsEqual(id1, id2).should.be.ok();
        });

        it('should return true when one id is an ObjectID and the other is a string and equivalent', function() {
            var id1 = new ObjectID();
            var id2 = id1.toString();
            this.pb.DAO.areIdsEqual(id1, id2).should.be.ok();
        });
    });

    describe('getObjectId', function() {

        it('should return object id', function() {
            var id = this.pb.util.uniqueId();
            this.pb.DAO.getObjectId(id).should.be.String().and.equal(id);
            this.pb.DAO.getObjectId('').should.not.be.instanceOf(ObjectID);

            id = new ObjectID();
            this.pb.DAO.getObjectId(id).should.be.instanceOf(ObjectID);
        });
    });

    describe('transfer', function() {

        it('should throw when the object to transfer is not an object', function() {
            this.pb.DAO.transfer.bind(null, 'some_odd_thing').should.throwError();
        });

        it('should throw when the type to transfer to is not a string', function() {
            this.pb.DAO.transfer.bind({object_type: 'user'}, null).should.throwError();
        });

        it('should transfer the object from one type to another clearing identifiers and history', function() {
            var obj = {
                object_type: 'widget1',
                hello: 'world',
                created: new Date(),
                last_modified: new Date(),
                id: 'abc123',
                _id: 'abc123'
            };
            this.pb.DAO.transfer(obj, 'widget2');
            should(obj._id).eql(undefined);
            should(obj.id).eql(undefined);
            should(obj.created).eql(undefined);
            should(obj.last_modified).eql(undefined);
            obj.object_type.should.eql('widget2');
            obj.hello.should.eql('world');
            Object.keys(obj).length.should.eql(2);
        })
    });

    describe('updateChangeHistory', function() {

        it('should throw if not an object', function() {
            this.pb.DAO.updateChangeHistory.bind(null).should.throwError();
        });

        it('should set the created date when there is no ID present on the object', function() {
            var obj = {};
            var now = Date.now();
            this.pb.DAO.updateChangeHistory(obj);
            obj.created.getTime().should.be.greaterThanOrEqual(now);
            obj.last_modified.should.eql(obj.created);
        });

        it('should update the last modified date/time but not the created date when the id is present', function() {
            var obj = {
                _id: 'acb',
                created: new Date(12333),
                last_modified: new Date(12333)
            };
            var now = Date.now();
            this.pb.DAO.updateChangeHistory(obj);
            obj.created.should.eql(new Date(12333));
            obj.last_modified.getTime().should.be.greaterThanOrEqual(now);
        });

        it('should reset the id property to the mongo specific _id property when the _id property exists', function() {
            var obj = {
                _id: 'abc'
            };
            this.pb.DAO.updateChangeHistory(obj);
            obj.id.should.eql(obj._id);
        });
    });
});
