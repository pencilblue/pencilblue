'use strict';

//dependencies
var should = require('should');
var sinon = require('sinon');
var TestHelpers = require('../../../test_helpers.js');

describe('Middleware', function() {

    TestHelpers.registerReset();

    var req, res;
    beforeEach(function() {
        req = {
            url: 'https://test1.localhost:8080/admin',
            headers: {
                host: 'test1.localhost:8080'
            }
        };
        res = {};
        req.handler = new this.pb.RequestHandler(null, req, res);
    });

    describe('startTime', function() {

        it('should set the current time as the startTime property on the request object and handler', function(done) {
            this.pb.Middleware.startTime(req, res, function(err) {
                should(err).eql(undefined);
                req.startTime.should.be.greaterThan(0);
                req.handler.startTime.should.be.greaterThan(0);
                done();
            });
        });
    });

    describe('urlParse', function() {

        it('should parse the URL on the request and set the host based on the header', function(done) {
            this.pb.Middleware.urlParse(req, res, function(err) {
                should(err).eql(undefined);
                req.handler.url.path.should.eql('/admin');
                req.handler.url.hostname.should.eql('test1.localhost');
                req.handler.hostname.should.eql('test1.localhost:8080');
                done();
            });
        });

        it('should default to the global hostname', function(done) {
            delete req.headers.host;

            this.pb.Middleware.urlParse(req, res, function(err) {
                should(err).eql(undefined);
                req.handler.hostname.should.eql('localhost:8080');
                done();
            });
        });
    });

    describe('', function() {

        it('', function(done) {
            done();
        });
    });
});

