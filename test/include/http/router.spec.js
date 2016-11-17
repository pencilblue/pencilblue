'use strict';

//dependencies
var should = require('should');
var TestHelpers = require('../../test_helpers.js');

describe('Router', function() {

    TestHelpers.registerReset();

    beforeEach(function() {

        //ensures a new class prototype so the static methods can be tested easily
        this.pb.Router = require('../../../include/http/router')(this.pb);
    });

    var i = 0;
    function middleware() {
        return { name: 'hello' + (i++), action: function() {}};
    }

    describe('indexOfMiddleware', function() {

        it('should return -1 when no middleware is registered with the specified name', function() {
            var result = this.pb.Router.indexOfMiddleware('non-existent');
            result.should.eql(-1);
        });
    });

    describe('addMiddlewareAt', function() {

        it('should add it at the specified position', function() {
            var m0 = middleware();
            var result = this.pb.Router.addMiddlewareAt(0, m0);
            result.should.eql(true);
            result = this.pb.Router.indexOfMiddleware(m0.name);
            result.should.eql(0);

            var m1 = middleware();
            result = this.pb.Router.addMiddlewareAt(1, m1);
            result.should.eql(true);
            result = this.pb.Router.indexOfMiddleware(m1.name);
            result.should.eql(1);

            var m2 = middleware();
            this.pb.Router.addMiddlewareAt(1, m2).should.eql(true);
            this.pb.Router.indexOfMiddleware(m2.name).should.eql(1);
            this.pb.Router.indexOfMiddleware(m0.name).should.eql(0);
            this.pb.Router.indexOfMiddleware(m1.name).should.eql(2);
        });

        it('should add it at position 0 when added at a position that doesnt exist', function() {
            var m = middleware();
            this.pb.Router.addMiddlewareAt(6, m).should.eql(true);
            this.pb.Router.indexOfMiddleware(m.name).should.eql(0);
        });
    });

    describe('addMiddlewareBeforeAll', function() {

        it('should return true when valid middleware is registered before all others and have an index of 0', function() {
            var m0 = middleware();
            this.pb.Router.addMiddlewareBeforeAll(m0).should.eql(true);
            this.pb.Router.indexOfMiddleware(m0.name).should.eql(0);

            var m1 = middleware();
            this.pb.Router.addMiddlewareBeforeAll(m1).should.eql(true);
            this.pb.Router.indexOfMiddleware(m1.name).should.eql(0);
            this.pb.Router.indexOfMiddleware(m0.name).should.eql(1);
        });
    });

    describe('addMiddlewareBefore', function() {

        it('should add middleware before the specified middleware', function() {
            var m0 = middleware();
            var m1 = middleware();
            var m2 = middleware();

            this.pb.Router.addMiddlewareBeforeAll(m1).should.eql(true);
            this.pb.Router.addMiddlewareBeforeAll(m0).should.eql(true);
            this.pb.Router.addMiddlewareBefore(m1.name, m2).should.eql(true);
            this.pb.Router.indexOfMiddleware(m2.name).should.eql(1);
        });
    });

    describe('addMiddlewareAfterAll', function() {

        it('should add the middleware after all other middleware', function() {
            var m0 = middleware();
            var m1 = middleware();
            var m2 = middleware();

            this.pb.Router.addMiddlewareAfterAll(m0).should.eql(true);
            this.pb.Router.addMiddlewareAfterAll(m1).should.eql(true);
            this.pb.Router.addMiddlewareAfterAll(m2).should.eql(true);
            this.pb.Router.indexOfMiddleware(m0.name).should.eql(0);
            this.pb.Router.indexOfMiddleware(m1.name).should.eql(1);
            this.pb.Router.indexOfMiddleware(m2.name).should.eql(2);
        });
    });

    describe('addMiddlewareAfter', function() {

        it('should add the middleware after the specified middleware', function() {
            var m0 = middleware();
            var m1 = middleware();
            this.pb.Router.addMiddlewareBeforeAll(m0).should.eql(true);
            this.pb.Router.addMiddlewareAfter(m0.name, m1).should.eql(true);
            this.pb.Router.indexOfMiddleware(m0.name).should.eql(0);
            this.pb.Router.indexOfMiddleware(m1.name).should.eql(1);
        });
    });

    describe('replaceMiddleware', function() {

        it('should replace the middleware with the specified name', function() {
            var m0 = middleware();
            var m1 = middleware();
            m1.name = m0.name;

            this.pb.Router.addMiddlewareBeforeAll(m0).should.eql(true);
            this.pb.Router.replaceMiddleware(m0.name, m1).should.eql(true);
            this.pb.Router.indexOfMiddleware(m1.name).should.eql(0);
        });
    });

    describe('removeMiddleware', function() {

        it('should remove the middleware with the specified name', function() {
            var m0 = middleware();
            this.pb.Router.addMiddlewareBeforeAll(m0).should.eql(true);
            this.pb.Router.removeMiddleware(m0.name).should.eql(true);
            this.pb.Router.indexOfMiddleware(m0.name).should.eql(-1);
        });
    });

    describe('redirect', function() {

        it('', function() {

        });
    });

    describe('continueAt', function() {

        it('', function() {

        });
    });

    describe('continueAfter', function() {

        it('', function() {

        });
    });

    describe('_handle', function() {

        it('', function() {

        });
    });

    describe('handle', function() {

        it('', function() {

        });
    });
});
