'use strict';

//dependencies
var Url = require('url');
var should = require('should');
var sinon = require('sinon');
var HttpStatusCodes = require('http-status-codes');
var TestHelpers = require('../../../test_helpers.js');

describe('Middleware', function() {

    TestHelpers.registerReset();

    //setup
    var sandbox, req, res;
    beforeEach(function() {
        sandbox = sinon.sandbox.create();
        req = {
            connection: {
                remoteAddress: '192.168.1.1'
            },
            url: 'https://test1.localhost:8080/admin',
            headers: {
                host: 'test1.localhost:8080',
                cookie: 'session_id=abc123;'
            }
        };
        res = {};
        req.handler = new this.pb.RequestHandler(null, req, res);
    });

    //tear down
    afterEach(function () {
        sandbox.restore();
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

    describe('checkPublicRoute', function() {

        it('should serve the public content when the route matches a public route', function() {
            var cb = sinon.spy();

            var req = {
                handler: {
                    url: Url.parse('https://localhost:8080/js/sample.js'),
                    servePublicContent: function(){}
                }
            };
            sinon.spy(req.handler, 'servePublicContent');
            var res = {};

            this.pb.Middleware.checkPublicRoute(req, res, cb);
            cb.calledOnce.should.eql(false);
            req.handler.servePublicContent.calledOnce.should.eql(true);
        });

        it('should continue to the next middleware since the route is not public', function(done) {
            var req = {
                handler: {
                    url: Url.parse('https://localhost:8080/admin')
                }
            };
            var res = {};
            this.pb.Middleware.checkPublicRoute(req, res, function(err) {
                should(err).eql(undefined);
                done();
            });
        });
    });

    describe('principal', function() {

        it('should parse the cookies and set them back to the header', function(done) {
            var self = this;
            this.pb.Middleware.principal(req, res, function() {
                req.headers[self.pb.SessionHandler.COOKIE_HEADER].should.eql({ '': undefined,  session_id: 'abc123'});
                done();
            });
        });

        it('should call back with error when retrieving the session errors', function(done) {

            var expectedError = new Error('hello');
            sandbox.stub(this.pb.session, 'open').callsArgWith(1, expectedError);
            this.pb.Middleware.principal(req, res, function(err) {
                err.message.should.eql('hello');
                done();
            });
        });

        it('should call back with error when retrieving the session fails', function(done) {
            sandbox.stub(this.pb.session, 'open').callsArgWith(1, null, null);
            this.pb.Middleware.principal(req, res, function(err) {
                err.message.should.eql('The session object was not valid.  Unable to generate a session object based on request.');
                done();
            });
        });

        it('should set the session cookie when no cookies were passed with the request', function(done) {
            delete req.headers.cookie;

            var self = this;
            this.pb.Middleware.principal(req, res, function() {
                req.headers[self.pb.SessionHandler.COOKIE_HEADER].should.eql({});
                req.setSessionCookie.should.eql(true);
                done();
            });
        });

        it('should set the session cookie when the session ID in the cookie does not match the ID in the active session', function(done) {
            sandbox.stub(this.pb.session, 'open').callsArgWith(1, null, { id: 'abc124' });

            var self = this;
            this.pb.Middleware.principal(req, res, function(err) {
                should(err).eql(undefined);
                req.setSessionCookie.should.eql(true);
                req.headers[self.pb.SessionHandler.COOKIE_HEADER].should.eql({ '': undefined,  session_id: 'abc123'});
                done();
            });
        });

        it('should set the retrieved session on the request and the handler', function(done) {
            var expectedSession =  { id: 'abc123' };
            sandbox.stub(this.pb.session, 'open').withArgs(req).callsArgWith(1, null, expectedSession);
            this.pb.Middleware.principal(req, res, function(err) {
                should(err).eql(undefined);
                req.handler.session.should.eql(expectedSession);
                req.session.should.eql(expectedSession);
                done();
            });
        });
    });

    describe('deriveSite', function() {

        it('', function(done) {
            done();
        });
    });

    describe('deriveRoute', function() {

        it('should call back with a not found error when the route is not found', function(done) {
            sandbox.stub(req.handler, 'getRoute').withArgs(req.handler.url.pathname).returns(null);
            this.pb.Middleware.deriveRoute(req, res, function(err) {
                err.code.should.eql(HttpStatusCodes.NOT_FOUND);
                done();
            });
        });

        it('should set the route on the request and handler', function(done) {
            var expectedRoute = { note: 'For testing purposes this value does not matter' };
            sandbox.stub(req.handler, 'getRoute').withArgs(req.handler.url.pathname).returns(expectedRoute);
            this.pb.Middleware.deriveRoute(req, res, function(err) {
                should(err).eql(undefined);
                req.route.should.eql(expectedRoute);
                req.handler.route.should.eql(expectedRoute);
                done();
            });
        });
    });

    describe('deriveActiveTheme', function() {

        var settingServiceCbIndex = 1;
        var settingService = { 'get': function(){} };

        it('should call back with an error when the setting service asynchronously calls back with an error', function(done) {
            var error = new Error('expected');
            req.siteObj = {
                uid: 'abc'
            };

            var mockSettingService = sandbox.mock(settingService);
            mockSettingService.expects('get').once().callsArgWith(settingServiceCbIndex, error, null);
            sandbox.stub(this.pb.SettingServiceFactory, 'getService')
                .withArgs(this.pb.config.settings.use_memory, this.pb.config.settings.use_cache, req.siteObj.uid)
                .returns(settingService);

            this.pb.Middleware.deriveActiveTheme(req, res, function(err) {
                err.should.eql(err);
                should(req.activeTheme).eql(undefined);
                should(req.handler.activeTheme).eql(null);
                mockSettingService.verify();
                done();
            });
        });

        it('should default to the theme specified in the configuration when an active theme is not set', function(done) {
            req.siteObj = {
                uid: 'abc'
            };
            var mockSettingService = sandbox.mock(settingService);
            mockSettingService.expects('get').once().callsArgWith(settingServiceCbIndex, null, null);
            sandbox.stub(this.pb.SettingServiceFactory, 'getService')
                .withArgs(this.pb.config.settings.use_memory, this.pb.config.settings.use_cache, req.siteObj.uid)
                .returns(settingService);

            var self = this;
            this.pb.Middleware.deriveActiveTheme(req, res, function(err) {
                should(err).eql(undefined);
                req.activeTheme.should.eql(self.pb.config.plugins.default);
                req.handler.activeTheme.should.eql(self.pb.config.plugins.default);
                mockSettingService.verify();
                done();
            });
        });

        it('should set the retrieved active theme as a property on the request and handler', function(done) {
            var expectedTheme = 'expected-theme';
            req.siteObj = {
                uid: 'abc'
            };
            var mockSettingService = sandbox.mock(settingService);
            mockSettingService.expects('get').once().callsArgWith(settingServiceCbIndex, null, expectedTheme);
            sandbox.stub(this.pb.SettingServiceFactory, 'getService')
                .withArgs(this.pb.config.settings.use_memory, this.pb.config.settings.use_cache, req.siteObj.uid)
                .returns(settingService);

            this.pb.Middleware.deriveActiveTheme(req, res, function(err) {
                should(err).eql(undefined);
                req.activeTheme.should.eql(expectedTheme);
                req.handler.activeTheme.should.eql(expectedTheme);
                mockSettingService.verify();
                done();
            });
        });
    });

    describe('deriveRouteTheme', function() {

        beforeEach(function() {
            req.activeTheme = 'some-active-theme';
            req.route = {
                themes: {
                    global: {
                        pencilblue: {
                            'get': {
                                hello: 'world'
                            }
                        }
                    }
                }
            };
        });

        [
            {
                theme: null,
                method: 'get',
                site: 'global'
            },
            {
                theme: 'pencilblue',
                method: null,
                site: 'global'
            },
            {
            theme: 'pencilblue',
            method: 'get',
            site: null
            }
        ].forEach(function(routeTheme) {
            it('should call back with a not found error when the route theme returns with: ' + JSON.stringify(routeTheme), function(done) {
                sandbox.stub(req.handler, 'getRouteTheme')
                    .withArgs(req.activeTheme, req.route)
                    .returns(routeTheme);
                this.pb.Middleware.deriveRouteTheme(req, res, function(err) {
                    err.code.should.eql(HttpStatusCodes.NOT_FOUND);
                    should(req.themeRoute).eql(undefined);
                    should(req.handler.themeRoute).eql(undefined);

                    done();
                });
            });
        });

        it('should derive the themed route from the route definition', function(done) {
            var routeTheme = {
                theme: 'pencilblue',
                method: 'get',
                site: 'global'
            };
            sandbox.stub(req.handler, 'getRouteTheme')
                .withArgs(req.activeTheme, req.route)
                .returns(routeTheme);
            this.pb.Middleware.deriveRouteTheme(req, res, function(err) {
                should(err).eql(undefined);
                req.themeRoute.should.eql(req.route.themes.global.pencilblue.get);
                req.handler.themeRoute.should.eql(req.route.themes.global.pencilblue.get);
                done();
            });
        });
    });

    describe('emitRouteThemeRetrieved', function() {

        it('should call back with an error when one is created by the middleware', function(done) {
            var expectedError = new Error('expected');
            sandbox.stub(req.handler, 'emitThemeRouteRetrieved').callsArgWith(0, expectedError);
            this.pb.Middleware.emitRouteThemeRetrieved(req, res, function(err) {
                err.should.eql(expectedError);
                req.handler.emitThemeRouteRetrieved.calledOnce.should.eql(true);
                done();
            });
        });

        it('should callback without error when the event is emitted without an error', function(done) {
            sandbox.stub(req.handler, 'emitThemeRouteRetrieved').callsArgWith(0);
            this.pb.Middleware.emitRouteThemeRetrieved(req, res, function (err) {
                should(err).eql(undefined);
                req.handler.emitThemeRouteRetrieved.calledOnce.should.eql(true);
                done();
            });
        });
    });

    describe('inactiveAccessCheck', function() {

        it('', function(done) {
            done();
        });
    });

    describe('systemSetupCheck', function() {

        it('', function(done) {
            done();
        });
    });

    describe('requiresAuthenticationCheck', function() {

        it('', function(done) {
            done();
        });
    });

    describe('authorizationCheck', function() {

        it('', function(done) {
            done();
        });
    });

    describe('derivePathVariables', function() {

        it('', function(done) {
            done();
        });
    });

    describe('localizedRouteCheck', function() {

        it('', function(done) {
            done();
        });
    });

    describe('instantiateController', function() {

        it('', function(done) {
            done();
        });
    });

    describe('parseRequestBody', function() {

        it('', function(done) {
            done();
        });
    });

    describe('initializeController', function() {

        it('', function(done) {
            done();
        });
    });

    describe('render', function() {

        it('', function(done) {
            done();
        });
    });

    describe('writeSessionCookie', function() {

        it('', function(done) {
            done();
        });
    });

    describe('writeResponse', function() {

        it('', function(done) {
            done();
        });
    });

    describe('responseTime', function() {

        it('', function(done) {
            done();
        });
    });

    describe('principalClose', function() {

        it('', function(done) {
            done();
        });
    });

    describe('getAll', function() {

        it('', function(done) {
            done();
        });
    });
});
