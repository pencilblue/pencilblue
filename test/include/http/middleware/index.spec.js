'use strict';

//dependencies
var Url = require('url');
var should = require('should');
var sinon = require('sinon');
var Cookies = require('cookies');
var HttpStatusCodes = require('http-status-codes');
var TestHelpers = require('../../../test_helpers.js');

describe('Middleware', function() {

    TestHelpers.registerReset();

    //setup
    var req, res;
    var sandbox = TestHelpers.registerSandbox();
    beforeEach(function() {
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

        afterEach(function() {
            this.pb.RequestHandler.sites = {};
            this.pb.RequestHandler.redirectHosts = {};
        });

        it('should redirect when an outdated hostname is used for a site', function() {
            this.pb.RequestHandler.sites = {
                'test2.localhost:8080': {}
            };
            this.pb.RequestHandler.redirectHosts = {
                'test1.localhost:8080': 'test2.localhost:8080'
            };
            req.router = {
                redirect: function(){}
            };
            sandbox.stub(req.router, 'redirect').withArgs(sinon.match.string, HttpStatusCodes.MOVED_PERMANENTLY);
            this.pb.Middleware.deriveSite(req, res, function() {});
            req.router.redirect.calledOnce.should.eql(true);
        });

        it('should call back with an error when the site is not available as a redirect host', function(done) {
            this.pb.RequestHandler.sites = {};
            this.pb.RequestHandler.redirectHosts = {
                'test1.localhost:8080': 'test2.localhost:8080'
            };
            this.pb.Middleware.deriveSite(req, res, function(err) {
                should(err instanceof Error).eql(true);
                done();
            });
        });

        it('should derive the site', function(done) {
            var siteObj = {
                uid: 'abcdefg',
                displayName: 'Hello World',
                supportedLocales: {}
            };
            this.pb.RequestHandler.sites = {
                'test1.localhost:8080': siteObj
            };
            var self = this;
            this.pb.Middleware.deriveSite(req, res, function(err) {
                should(err).eql(undefined);
                req.handler.siteObj.should.eql(siteObj);
                req.siteObj.should.eql(siteObj);
                should(req.localizationService instanceof self.pb.Localization).eql(true);
                req.site.should.eql(siteObj.uid);
                req.handler.site.should.eql(siteObj.uid);
                req.siteName.should.eql(siteObj.displayName);
                req.handler.siteName.should.eql(siteObj.displayName);
                done();
            });
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

        beforeEach(function() {
            req.themeRoute = {};
            req.siteObj = {};
            req.router = {}
        });

        it('should redirect to the admin home page when: the site is inactive, inactive access is not allowed for the route, and the site is global', function(done) {
            req.siteObj.active = false;
            req.themeRoute.inactive_site_access = false;
            req.siteObj.uid = this.pb.SiteService.GLOBAL_SITE;

            req.router.redirect = sandbox.stub().withArgs('/admin');
            this.pb.Middleware.inactiveAccessCheck(req, res, null);
            req.router.redirect.calledOnce.should.eql(true);

            done();
        });

        it('should call back with a not found error when: the site is inactive, inactive access is not allowed for the route, and the site is not global', function(done) {
            req.siteObj.active = false;
            req.themeRoute.inactive_site_access = false;
            req.siteObj.uid = 'abcd';

            this.pb.Middleware.inactiveAccessCheck(req, res, function(err) {

                err.code.should.eql(HttpStatusCodes.NOT_FOUND);
                done();
            });
        });

        it('should pass the check if the site is inactive but the route allows for inactive access', function(done) {
            req.siteObj.active = false;
            req.themeRoute.inactive_site_access = true;

            this.pb.Middleware.inactiveAccessCheck(req, res, function(err) {

                should(err).eql(undefined);
                done();
            });
        });

        it('should pass the check if the site is active', function(done) {
            req.siteObj.active = true;

            this.pb.Middleware.inactiveAccessCheck(req, res, function(err) {

                should(err).eql(undefined);
                done();
            });
        });
    });

    describe('systemSetupCheck', function() {

        it('should call back with an error when the system setup check fails', function(done) {
            var expectedError = new Error('expected')
            req.themeRoute = { hello: 'world' };
            sandbox.stub(req.handler, 'checkSystemSetup').callsArgWith(1, expectedError);

            this.pb.Middleware.systemSetupCheck(req, res, function(err) {
                err.should.eql(expectedError);
                done();
            });
        });

        it('should redirect to the specified location when the check is not successful', function(done) {
            var expectedResult = {
                success: false,
                redirect: '/hello/world'
            };
            req.themeRoute = { hello: 'world' };
            req.router = { redirect: function(){}};
            sandbox.stub(req.handler, 'checkSystemSetup').callsArgWith(1, null, expectedResult);
            sandbox.stub(req.router, 'redirect').withArgs(expectedResult.redirect);

            this.pb.Middleware.systemSetupCheck(req, res, null);
            req.router.redirect.calledOnce.should.eql(true);

            done();
        });

        it('should pass the check when the check passes', function(done) {
            var expectedResult = {
                success: true
            };
            req.themeRoute = { hello: 'world' };
            sandbox.stub(req.handler, 'checkSystemSetup').callsArgWith(1, null, expectedResult);

            this.pb.Middleware.systemSetupCheck(req, res, function(err) {
                should(err).eql(undefined);
                req.handler.checkSystemSetup.calledOnce.should.eql(true);
                done();
            })
        });
    });

    describe('requiresAuthenticationCheck', function() {

        it('should call back with a NOT AUTHORIZED error when a redirect is detected', function(done) {
            var authCheckResult = {
                redirect: true
            };
            sandbox.stub(this.pb.RequestHandler, 'checkRequiresAuth').returns(authCheckResult);
            this.pb.Middleware.requiresAuthenticationCheck(req, res, function(err) {
                err.code.should.eql(HttpStatusCodes.UNAUTHORIZED);
                done();
            });
        });

        it('should pass the authentication check when no redirect property is set on the result', function(done) {
            var authCheckResult = {
                redirect: false
            };
            sandbox.stub(this.pb.RequestHandler, 'checkRequiresAuth').returns(authCheckResult);
            this.pb.Middleware.requiresAuthenticationCheck(req, res, function(err) {
                should(err).eql(null);
                done();
            });
        });
    });

    describe('authorizationCheck', function() {

        it('should call back with a FORBIDDEN error when role check fails', function(done) {
            var roleCheckResult = {
                success: false
            };
            sandbox.stub(this.pb.RequestHandler, 'checkAdminLevel').returns(roleCheckResult);
            this.pb.Middleware.authorizationCheck(req, res, function(err) {
                err.code.should.eql(HttpStatusCodes.FORBIDDEN);
                done();
            });
        });

        it('should call back with a FORBIDDEN error when permission check fails', function(done) {
            var roleCheckResult = {
                success: true
            };
            var permCheckResult = {
                success: false
            };
            sandbox.stub(this.pb.RequestHandler, 'checkAdminLevel').returns(roleCheckResult);
            sandbox.stub(this.pb.RequestHandler, 'checkPermissions').returns(permCheckResult);
            this.pb.Middleware.authorizationCheck(req, res, function(err) {
                err.code.should.eql(HttpStatusCodes.FORBIDDEN);
                done();
            });
        });

        it('should pass the check when the role and permissions are good', function(done) {
            var roleCheckResult = {
                success: true
            };
            var permCheckResult = {
                success: true
            };
            sandbox.stub(this.pb.RequestHandler, 'checkAdminLevel').returns(roleCheckResult);
            sandbox.stub(this.pb.RequestHandler, 'checkPermissions').returns(permCheckResult);
            this.pb.Middleware.authorizationCheck(req, res, function(err) {
                should(err).eql(null);
                done();
            });
        });
    });

    describe('derivePathVariables', function() {

        it('should set the pathVars property on the request', function(done) {
            var expected = { hello: 'world' };
            sandbox.stub(req.handler, 'getPathVariables').returns(expected);
            this.pb.Middleware.derivePathVariables(req, res, function(err) {
                should(err).eql(undefined);
                req.pathVars.should.eql(expected);
                done();
            });
        });
    });

    describe('localizedRouteCheck', function() {

        it('should call back with a NOT FOUND error when the route supports localization but the site does not support the locale', function(done) {
            req.pathVars = {
                locale: 'en-US'
            };
            req.siteObj = {
                supportedLocales: {}
            };
            this.pb.Middleware.localizedRouteCheck(req, res, function(err) {
                err.code.should.eql(HttpStatusCodes.NOT_FOUND);
                done();
            });
        });

        it('should update the localization service when the route is localized and the intended locale is supported by the site', function(done) {
            req.pathVars = {
                locale: 'en-US'
            };
            req.siteObj = {
                supportedLocales: {
                    'en-US': true
                }
            };
            req.session = { hello: 'world' };
            var localizationService = {};
            sandbox.stub(req.handler, 'deriveLocalization')
                .withArgs({session: req.session, routeLocalization: 'en-US'})
                .returns(localizationService);

            this.pb.Middleware.localizedRouteCheck(req, res, function(err) {
                should(err).eql(undefined);
                req.localizationService.should.eql(localizationService);
                req.handler.localizationService.should.eql(localizationService);
                req.handler.deriveLocalization.calledOnce.should.eql(true);
                done();
            });
        });

        it('should skip the localization check when the route does not support localization', function(done) {
            req.pathVars = {};
            this.pb.Middleware.localizedRouteCheck(req, res, function(err) {
                should(err).eql(undefined);
                should(req.handler.localizationService).eql(undefined);
                done();
            });
        });
    });

    describe('instantiateController', function() {

        it('should create a new instance of the controller from the route theme properties: site, theme, HTTP method', function(done) {
            function ControllerSample(){}
            req.routeTheme = {
                site: 'global',
                theme: 'pencilblue',
                method: 'get'
            };
            req.route = {
                themes: {
                    global: {
                        pencilblue: {
                            'get': {
                                controller: ControllerSample
                            }
                        }
                    }
                }
            };
            this.pb.Middleware.instantiateController(req, res, function(err) {
                should(err).eql(undefined);
                (req.controllerInstance instanceof ControllerSample).should.eql(true);
                done();
            });
        });
    });

    describe('parseRequestBody', function() {

        it('should call back with a bad request error when the request body fails to parse', function(done) {
            var expectedError = new Error('expected');
            req.themeRoute = {
                request_body: 'application/json'
            };
            sandbox.stub(req.handler, 'parseBody')
                .withArgs(req.themeRoute.request_body, sinon.match.func)
                .callsArgWith(1, expectedError);
            this.pb.Middleware.parseRequestBody(req, res, function(err) {
                err.code.should.eql(HttpStatusCodes.BAD_REQUEST);
                should(req.body).eql(undefined);
                req.handler.parseBody.calledOnce.should.eql(true);
                done();
            });
        });

        it('should set the parsed body object on the request when the body is valid', function(done) {
            var expectedBody = { hello: 'world' };
            req.themeRoute = {
                request_body: 'application/json'
            };
            sandbox.stub(req.handler, 'parseBody')
                .withArgs(req.themeRoute.request_body, sinon.match.func)
                .callsArgWith(1, null, expectedBody);
            this.pb.Middleware.parseRequestBody(req, res, function(err) {
                should(err).eql(null);
                req.body.should.eql(expectedBody);
                req.handler.parseBody.calledOnce.should.eql(true);
                done();
            });
        });
    });

    describe('initializeController', function() {

        it('should call back with an error when the controller fails to initialize', function(done) {
            var expectedError = new Error('expected');
            var expectedContext = { hello: 'world' };
            req.controllerInstance = {
                init: function(){}
            };
            sandbox.stub(this.pb.RequestHandler, 'buildControllerContext')
                .withArgs(req, res)
                .returns(expectedContext);
            sandbox.stub(req.controllerInstance, 'init')
                .withArgs(expectedContext, sinon.match.func)
                .callsArgWith(1, expectedError);
            var self = this;
            this.pb.Middleware.initializeController(req, res, function(err) {
                err.should.eql(expectedError);
                self.pb.RequestHandler.buildControllerContext.calledOnce.should.eql(true);
                req.controllerInstance.init.calledOnce.should.eql(true);
                done();
            });
        });

        it('should build the controller context and initialize the controller', function(done) {
            var expectedContext = { hello: 'world' };
            req.controllerInstance = {
                init: function(){}
            };
            sandbox.stub(this.pb.RequestHandler, 'buildControllerContext')
                .withArgs(req, res)
                .returns(expectedContext);
            sandbox.stub(req.controllerInstance, 'init')
                .withArgs(expectedContext, sinon.match.func)
                .callsArgWith(1, null);
            var self = this;
            this.pb.Middleware.initializeController(req, res, function(err) {
                should(err).eql(null);
                self.pb.RequestHandler.buildControllerContext.calledOnce.should.eql(true);
                req.controllerInstance.init.calledOnce.should.eql(true);
                done();
            });
        });
    });

    describe('render', function() {

        it('should call back with an error when the controller result is an error', function(done) {
            var expectedError = new Error('expected');
            req.controllerInstance = {
                render: function(){}
            };
            req.themeRoute = { handler: 'render' };
            sandbox.stub(req.controllerInstance, 'render')
                .withArgs(sinon.match.any)
                .callsArgWith(0, expectedError);
            this.pb.Middleware.render(req, res, function(err) {
                err.should.eql(expectedError);
                done();
            });
        });

        it('should default to "render" when the handler name is not specified', function(done) {
            var expectedResult = '<html><body>Hello World!</body></html>';
            req.controllerInstance = {
                render: function(){}
            };
            req.themeRoute = {};
            sandbox.stub(req.controllerInstance, 'render')
                .withArgs(sinon.match.any)
                .callsArgWith(0, expectedResult);
            this.pb.Middleware.render(req, res, function(err) {
                should(err).eql(undefined);
                req.controllerResult.should.eql(expectedResult);
                req.controllerInstance.render.calledOnce.should.eql(true);
                done();
            });
        });

        it('should execute the controller with the specified handler name', function(done) {
            var expectedResult = '<html><body>Hello World!</body></html>';
            req.controllerInstance = {
                doSomething: function(){}
            };
            req.themeRoute = { handler: 'doSomething' };
            sandbox.stub(req.controllerInstance, 'doSomething')
                .withArgs(sinon.match.any)
                .callsArgWith(0, expectedResult);
            this.pb.Middleware.render(req, res, function(err) {
                should(err).eql(undefined);
                req.controllerResult.should.eql(expectedResult);
                req.controllerInstance.doSomething.calledOnce.should.eql(true);
                done();
            });
        });
    });

    describe('writeSessionCookie', function() {

        it('should catch the synchronous error that is thrown when the attempt to write the session cookie fails', function(done) {
            var expectedError = new Error('expected');
            req.setSessionCookie = true;
            req.session = { hello: 'world' };
            sandbox.stub(this.pb.SessionHandler, 'getSessionCookie')
                .withArgs(req.session).throws(expectedError);
            sandbox.stub(this.pb.log, 'error').withArgs(sinon.match.string, sinon.match.string);
            var self = this;
            this.pb.Middleware.writeSessionCookie(req, res, function(err) {
                should(err).eql(undefined);
                self.pb.SessionHandler.getSessionCookie.calledOnce.should.eql(true);
                self.pb.log.error.calledOnce.should.eql(true);
                done();
            });
        });

        it('should skip writting the session cookie if the flag setSessionCookie is not set on the request object', function(done) {
            req.setSessionCookie = false;
            sandbox.stub(this.pb.SessionHandler, 'getSessionCookie');
            var self = this;
            this.pb.Middleware.writeSessionCookie(req, res, function(err) {
                should(err).eql(undefined);
                self.pb.SessionHandler.getSessionCookie.called.should.eql(false);
                done();
            });
        });

        it('should set the cookie when the flag setSessionCookie is set on the request object', function(done) {
            req.setSessionCookie = true;
            req.session = { uid: 'abc123' };
            sandbox.stub(this.pb.SessionHandler, 'getSessionCookie')
                .withArgs(req.session).returns();
            sandbox.stub(this.pb.log, 'error');
            sandbox.stub(Cookies.prototype, 'set')
                .withArgs(this.pb.SessionHandler.COOKIE_NAME, req.session.uid, sinon.match.any);
            var self = this;
            this.pb.Middleware.writeSessionCookie(req, res, function(err) {
                should(err).eql(undefined);
                self.pb.SessionHandler.getSessionCookie.calledOnce.should.eql(true);
                self.pb.log.error.called.should.eql(false);
                done();
            });
        });
    });

    describe('writeResponse', function() {

        it('should do a redirect when the controller result contains a string typed redirect property', function(done) {
            req.controllerResult = { redirect: '/', code: HttpStatusCodes.MOVED_PERMANENTLY };
            sandbox.stub(req.handler, 'doRedirect').withArgs(req.controllerResult.redirect, req.controllerResult.code);

            this.pb.Middleware.writeResponse(req, res, function(err) {
                should(err).eql(undefined);
                req.didRedirect.should.eql(true);
                req.handler.doRedirect.calledOnce.should.eql(true);
                done();
            });
        });

        it('should write the response when the result does not contain a string redirect property', function(done) {
            req.controllerResult = { hello: 'world' };
            sandbox.stub(req.handler, 'doRedirect');
            sandbox.stub(req.handler, 'writeResponse').withArgs(req.controllerResult);

            this.pb.Middleware.writeResponse(req, res, function(err) {
                should(err).eql(undefined);
                req.handler.doRedirect.called.should.eql(false);
                req.handler.writeResponse.calledOnce.should.eql(true);
                done();
            });
        });
    });

    describe('responseTime', function() {

        it('should set the end time on the request and log the interaction when: log level is debug, no redirect, and no status code', function(done) {
            req.didRedirect = false;
            req.url = '/admin/hello';
            req.controllerResult = {};
            sandbox.stub(this.pb.log, 'isDebug').returns(true);
            sandbox.stub(this.pb.log, 'debug').withArgs(sinon.match.string, sinon.match.number, req.url, '', '');

            var self = this;
            this.pb.Middleware.responseTime(req, res, function(err) {
                should(err).eql(undefined);
                self.pb.log.isDebug.calledOnce.should.eql(true);
                self.pb.log.debug.calledOnce.should.eql(true);
                done();
            });
        });

        it('should set the end time on the request and log the interaction when: log level is debug, a redirect, and a status code', function(done) {
            req.didRedirect = true;
            req.url = '/admin/hello';
            req.controllerResult = { redirect: '/somewhere/else', code: HttpStatusCodes.MOVED_TEMPORARILY };
            sandbox.stub(this.pb.log, 'isDebug').returns(true);
            sandbox.stub(this.pb.log, 'debug')
                .withArgs(sinon.match.string, sinon.match.number, req.url, ' REDIRECT=/somewhere/else', ' CODE='+HttpStatusCodes.MOVED_TEMPORARILY);

            var self = this;
            this.pb.Middleware.responseTime(req, res, function(err) {
                should(err).eql(undefined);
                self.pb.log.isDebug.calledOnce.should.eql(true);
                self.pb.log.debug.calledOnce.should.eql(true);
                done();
            });
        });
    });

    describe('principalClose', function() {

        it('should not attempt to close the session if no session is available on the request', function(done) {
            delete req.session;

            sandbox.stub(this.pb.session, 'close');
            var self = this;
            this.pb.Middleware.principalClose(req, res, function(err) {
                should(err).eql(undefined);
                self.pb.session.close.called.should.eql(false);
                done();
            });
        });

        it('should attempt to close the session and log the error when one is provided as an argument to the call back', function(done) {
            req.session = { hello: 'world', uid: 'abc' };
            var expectedError = new Error('expected');
            sandbox.stub(this.pb.session, 'close')
                .withArgs(req.session, sinon.match.func)
                .callsArgWith(1, expectedError);
            sandbox.stub(this.pb.log, 'warn').withArgs(sinon.match.string, req.session.uid);
            var self = this;
            this.pb.Middleware.principalClose(req, res, function(err) {
                should(err).eql(undefined);
                self.pb.session.close.calledOnce.should.eql(true);
                self.pb.log.warn.calledOnce.should.eql(true);
                done();
            });
        });
    });

    describe('getAll', function() {

        it('should return all default middleware', function() {
            this.pb.Middleware.getAll().length.should.be.greaterThan(0);
        });
    });
});

