'use strict';

//dependencies
var should = require('should');
var sinon = require('sinon');
var TestHelpers = require('../../test_helpers.js');

describe('Router', function() {

    TestHelpers.registerReset();

    beforeEach(function() {

        //ensures a new class prototype so the static methods can be tested easily
        this.pb.Router = require('../../../include/http/router')(this.pb);
    });

    var i = 0;
    function middleware() {
        return { name: 'hello' + (i++), action: function(req, res, next) { next(); }};
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

        it('should set a controller result and call continue after render', function() {
            var req = {};
            var res = {};
            var router = new this.pb.Router(req, res);
            sinon.spy(router, 'continueAfter');

            var location = 'https://pencilblue.org';
            var statusCode = 301;
            router.redirect(location, statusCode);
            req.controllerResult.redirect.should.eql(location);
            req.controllerResult.code.should.eql(statusCode);
            router.continueAfter.calledOnce.should.eql(true);
            router.continueAfter.getCall(0).args[0].should.eql('render');
        });
    });

    describe('continueAt', function() {

        it('should continue to handle the request at the middle from the specified position', function() {
            var req = {};
            var res = {};
            var router = new this.pb.Router(req, res);
            sinon.spy(router, '_handle');

            var index = 6;
            router.continueAt(index);
            router.index.should.eql(index);
            router._handle.calledOnce.should.eql(true);
            router._handle.getCall(0).args[0].should.eql(req);
            router._handle.getCall(0).args[1].should.eql(res);
        });
    });

    describe('continueAfter', function() {

        it('should continue to handle the request after the specified middleware', function() {
            var m0 = middleware();
            var m1 = middleware();
            var m2 = middleware();

            this.pb.Router.addMiddlewareAfterAll(m0).should.eql(true);
            this.pb.Router.addMiddlewareAfterAll(m1).should.eql(true);
            this.pb.Router.addMiddlewareAfterAll(m2).should.eql(true);

            var req = {};
            var res = {};
            var router = new this.pb.Router(req, res);
            sinon.spy(router, 'continueAt');

            router.continueAfter(m1.name);
            router.continueAt.calledOnce.should.eql(true);
            router.continueAt.getCall(0).args[0].should.eql(this.pb.Router.indexOfMiddleware(m2.name));
        });
    });

    describe('_handle', function() {

        it('should not execute any middleware when non is registered', function(done) {
            var req = {};
            var res = {};
            var router = new this.pb.Router(req, res);
            router._handle(req, res).then(done);
        });

        it('should set an error result and call continueAfter render when an error occurs', function(done) {
            var render = {
                name: 'render',
                action: function(req, res, next) {
                    next(new Error('oops'));
                }
            };
            var afterRender = {
                name: 'afterRender',
                action: function(req, res, next) {
                    next();
                }
            };
            sinon.spy(render, 'action');
            sinon.spy(afterRender, 'action');

            this.pb.Router.addMiddlewareAfterAll(render).should.eql(true);
            this.pb.Router.addMiddlewareAfterAll(afterRender).should.eql(true);

            var resultData = { content: 'hello world' };
            var req = {
                handler: {
                    serveError: function(err, data) {
                        data.handler(resultData);
                    }
                }
            };
            sinon.spy(req.handler, 'serveError');
            var res = {};
            var router = new this.pb.Router(req, res);
            router._handle(req, res).then(function() {
                render.action.calledOnce.should.eql(true);
                afterRender.action.calledOnce.should.eql(true);
                req.handler.serveError.calledOnce.should.eql(true);
                req.controllerResult.should.eql(resultData);

                done();
            });
        });
    });

    describe('handle', function() {

        it('should set the request handler and router instance and then call _handle', function(done) {

            var req = {
                url: 'https://pencilblue.org',
                headers: {
                    host: 'pencilblue.org'
                }
            };
            var res = {};
            var router = new this.pb.Router(req, res);
            sinon.spy(router, '_handle');

            router.handle(req, res).then(function() {
                router._handle.calledOnce.should.eql(true);
                req.handler.should.not.be.null;
                req.router.should.eql(router);

                done();
            });
        });

        var expectedError = new Error('expected');
        [
            {
                name: 'thrown synchronously',
                action: function() {
                    throw expectedError;
                }
            },
            {
                name: 'thrown asynchronously',
                action: function() {
                    process.nextTick(function() {
                        throw expectedError;
                    });
                }
            }
        ].forEach(function(middleware) {
            it.skip('should catch and handle an error that is ' + middleware.name + ' from middleware', function(done) {
                this.pb.Router.addMiddlewareBeforeAll(middleware).should.eql(true);

                var req = {
                    url: 'https://pencilblue.org',
                    headers: {
                        host: 'pencilblue.org'
                    }
                };
                var res = {};
                var router = new this.pb.Router(req, res);
                router.handle(req, res)
                    .then(function() {
                        done.fail();
                    },
                    function(err) {
                        err.should.eql(expectedError);
                        done();
                    });
            });
        });
    });
});
