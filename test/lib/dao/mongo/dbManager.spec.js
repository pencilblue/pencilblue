'use strict';

//dependencies
var Q = require('q');
var should = require('should');
var DbManager = require('../../../../include/dao/db_manager');
var IndexService = require('../../../../lib/dao/mongo/indexService');
var TestHelpers = require('../../../test_helpers');

describe('DbManager', function() {

    var sandbox = TestHelpers.registerSandbox();

    describe('ensureIndices', function() {

        it('should provide an error when it fails to acquire the DB object', function(done) {
            var expected = new Error('expected');
            sandbox.stub(DbManager, 'getDb').returns(Q.reject(expected));
            DbManager.ensureIndices([]).catch(function(actual) {
                actual.should.eql(expected);
                done();
            });
        });

        it('should provide the state of each attempt to ensure an index is created', function(done) {
            var failedProcedure = {};
            var procedures = [
                failedProcedure,
                failedProcedure
            ];
            var db = {};
            sandbox.stub(DbManager, 'getDb').returns(Q.resolve(db));
            sandbox.stub(IndexService, 'ensureIndex')
                .withArgs(db, failedProcedure).returns(Q.reject(TestHelpers.ERR));

            DbManager.ensureIndices(procedures).then(function(actuals) {
                Array.isArray(actuals).should.eql(true);
                actuals.length.should.eql(2);
                actuals.forEach(function(actual) {
                    actual.state.should.eql('rejected');
                    actual.reason.should.eql(TestHelpers.ERR);
                });
                done();
            }).catch(function(err) {
                throw new Error('not expected');
            });
        });
    });
});
