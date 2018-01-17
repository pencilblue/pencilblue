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
    before(function() {
        this.getMiddleware = (name) => {
            const step = this.pb.Middleware.getAll().find(step => step.name === name)
            return step && step.action
        }
    })
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
        req.handler.url = Url.parse(req.url);
        req.handler.hostname = req.headers.host;
        req.method = 'GET'
    });

    describe('startTime', function() {
        it('should set the current time as the startTime property on the request object and handler', function(done) {
            this.getMiddleware('startTime')(req, res, function(err) {
                should(err).eql(undefined);
                req.startTime.should.be.greaterThan(0);
                done();
            });
        });
    });

    describe('urlParse', function() {

        it('should parse the URL on the request and set the host based on the header', function(done) {
            this.getMiddleware('urlParse')(req, res, function(err) {
                should(err).eql(undefined);
                req.handler.url.path.should.eql('/admin');
                req.handler.url.hostname.should.eql('test1.localhost');
                req.handler.hostname.should.eql('test1.localhost:8080');
                done();
            });
        });

        it('should default to the global hostname', function(done) {
            delete req.headers.host;

            this.getMiddleware('urlParse')(req, res, function(err) {
                should(err).eql(undefined);
                req.handler.hostname.should.eql('localhost:8080');
                done();
            });
        });
    });

    describe('checkPublicRoute', function() {

        it('should serve the public content when the route matches a public route', function(done) {
            var req = {
                handler: {
                    url: Url.parse('https://localhost:8080/js/sample.js'),
                    servePublicContent: function(){}
                },
                router: {
                    continueAfter: sinon.spy()
                }
            };
            sinon.spy(req.handler, 'servePublicContent');
            var res = {};

            this.getMiddleware('checkPublicRoute')(req, res, () => {
                req.handler.servePublicContent.calledOnce.should.eql(true);
                req.router.continueAfter.calledOnce.should.eql(true);
                done()
            });
        });

        it('should continue to the next middleware since the route is not public', function(done) {
            var req = {
                handler: {
                    url: Url.parse('https://localhost:8080/admin')
                }
            };
            var res = {};
            this.getMiddleware('checkPublicRoute')(req, res, function(err) {
                should(err).eql(undefined);
                done();
            });
        });
    });

    describe('openSession', function() {

        it('should parse the cookies and set them back to the header', function(done) {
            var self = this;
            this.getMiddleware('openSession')(req, res, function() {
                req.headers[self.pb.SessionHandler.COOKIE_HEADER].should.eql({ '': undefined,  session_id: 'abc123'});
                done();
            });
        });

        it('should call back with error when retrieving the session errors', function(done) {

            var expectedError = new Error('hello');
            sandbox.stub(this.pb.session, 'open').callsArgWith(1, expectedError);
            this.getMiddleware('openSession')(req, res, function(err) {
                err.message.should.eql('hello');
                done();
            });
        });

        it('should call back with error when retrieving the session fails', function(done) {
            sandbox.stub(this.pb.session, 'open').callsArgWith(1, null, null);
            this.getMiddleware('openSession')(req, res, function(err) {
                err.message.should.eql('The session object was not valid.  Unable to generate a session object based on request.');
                done();
            });
        });

        it('should set the session cookie when no cookies were passed with the request', function(done) {
            delete req.headers.cookie;

            var self = this;
            this.getMiddleware('openSession')(req, res, function() {
                req.headers[self.pb.SessionHandler.COOKIE_HEADER].should.eql({});
                req.setSessionCookie.should.eql(true);
                done();
            });
        });

        it('should set the session cookie when the session ID in the cookie does not match the ID in the active session', function(done) {
            sandbox.stub(this.pb.session, 'open').callsArgWith(1, null, { uid: 'abc124' });

            var self = this;
            this.getMiddleware('openSession')(req, res, function(err) {
                should(err).eql(undefined);
                req.setSessionCookie.should.eql(true);
                req.headers[self.pb.SessionHandler.COOKIE_HEADER].should.eql({ '': undefined,  session_id: 'abc123'});
                done();
            });
        });
        it('should set the session cookie when the cms tn session ID in the cookie does not match the ID in the active session', function(done) {
            sandbox.stub(this.pb.session, 'open').callsArgWith(1, null, { uid: 'abc124' });
            req.headers.cookie = 'cms_tn_session_id=abc123;';
            var self = this;
            this.getMiddleware('openSession')(req, res, function(err) {
                should(err).eql(undefined);
                req.setSessionCookie.should.eql(true);
                req.headers[self.pb.SessionHandler.COOKIE_HEADER].should.eql({ '': undefined,  cms_tn_session_id: 'abc123'});
                done();
            });
        });
        it('should set the retrieved session on the request and the handler', function(done) {
            var expectedSession =  { id: 'abc123' };
            sandbox.stub(this.pb.session, 'open').withArgs(req).callsArgWith(1, null, expectedSession);
            this.getMiddleware('openSession')(req, res, function(err) {
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

        it('should redirect when an outdated hostname is used for a site', function(done) {
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
            this.getMiddleware('deriveSite')(req, res, function() {
                req.router.redirect.calledOnce.should.eql(true);
                done()
            });
        });

        it('should call back with an error when the site is not available as a redirect host', function(done) {
            this.pb.RequestHandler.sites = {};
            this.pb.RequestHandler.redirectHosts = {
                'test1.localhost:8080': 'test2.localhost:8080'
            };
            this.getMiddleware('deriveSite')(req, res, function(err) {
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
            this.getMiddleware('deriveSite')(req, res, function(err) {
                should(err).eql(undefined);
                req.handler.siteObj.should.eql(siteObj);
                req.siteObj.should.eql(siteObj);
                req.site.should.eql(siteObj.uid);
                req.handler.site.should.eql(siteObj.uid);
                req.siteName.should.eql(siteObj.displayName);
                req.handler.siteName.should.eql(siteObj.displayName);
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

            this.getMiddleware('deriveActiveTheme')(req, res, function(err) {
                err.should.eql(err);
                should(req.activeTheme).eql(undefined);
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
            this.getMiddleware('deriveActiveTheme')(req, res, function(err) {
                should(err).eql(undefined);
                req.activeTheme.should.eql(self.pb.config.plugins.default);
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

            this.getMiddleware('deriveActiveTheme')(req, res, function(err) {
                should(err).eql(undefined);
                req.activeTheme.should.eql(expectedTheme);
                mockSettingService.verify();
                done();
            });
        });
    });

    describe('deriveRoute', function() {
        let deriveRoute
        before(function() {
            deriveRoute = this.getMiddleware('deriveRoute')
            this.pb.RequestHandler.registerRoute({path: '/foo', method: 'GET', controller: function (){}}, 'sample')
            this.pb.RequestHandler.registerRoute({path: '/bar', controller: function (){}}, 'test_theme')
            this.pb.RequestHandler.registerRoute({path: '/:locale', method: 'GET', controller: function (){}}, 'sample')
            this.pb.RequestHandler.registerRoute({path: '/users/:id', method: 'GET', controller: function (){}}, 'base')
            this.pb.RequestHandler.registerRoute({path: '/users/:id', method: 'DELETE', controller: function (){}}, 'base')
            this.pb.RequestHandler.registerRoute({path: '/users/:name', method: 'POST', controller: function (){}}, 'base')
            this.pb.RequestHandler.registerRoute({path: '/theme', method: 'GET', controller: function (){}, plugin: 'test_theme'}, 'test_theme')
            this.pb.RequestHandler.registerRoute({path: '/theme', method: 'GET', controller: function (){}, plugin: 'sample'}, 'sample')
            this.pb.RequestHandler.registerRoute({path: '/sample', method: 'GET', controller: function (){}, plugin: 'base'}, 'base')
            this.pb.RequestHandler.registerRoute({path: '/sample', method: 'GET', controller: function (){}, plugin: 'sample'}, 'sample')
            this.pb.RequestHandler.registerRoute({path: '/base', method: 'GET', controller: function (){}, plugin: 'base'}, 'base')
            this.pb.RequestHandler.registerRoute({path: '/base', method: 'GET', controller: function (){}, plugin: 'pencilblue'}, 'pencilblue')
            this.pb.RequestHandler.registerRoute({path: '/pb', method: 'GET', controller: function (){}, plugin: 'pencilblue'}, 'pencilblue')

        })

        beforeEach(function() {
            req.activeTheme = 'test_theme'
            sandbox.stub(this.pb.PluginService.prototype, 'getActivePluginNames').returns(['sample', 'test_theme', 'base'])
        })

        it ('should match exact routes before variable routes', (done) => {
            req.handler.url = Url.parse('/foo')
            deriveRoute(req, res, (err) => {
                should(err).eql(undefined)
                req.route.path.should.eql('/foo')
                done()
            })
        })

        it ('should match any method to ALL', (done) => {
            req.handler.url = Url.parse('/bar')
            req.method = 'PUT'
            deriveRoute(req, res, (err) => {
                should(err).eql(undefined)
                req.route.path.should.eql('/bar')
                done()
            })
        })

        it ('should match variables after exact matches', (done) => {
            req.handler.url = Url.parse('/en-US')
            deriveRoute(req, res, (err) => {
                should(err).eql(undefined)
                req.route.path.should.eql('/:locale')
                req.pathVars.locale.should.eql('en-US')
                done()
            })
        })

        it ('should allow trailing slash', (done) => {
            req.handler.url = Url.parse('/users/1/')
            deriveRoute(req, res, (err) => {
                should(err).eql(undefined)
                req.route.path.should.eql('/users/:id')
                req.route.method.should.eql('GET')
                req.pathVars.id.should.eql('1')
                done()
            })
        })

        it ('should match on method', (done) => {
            req.handler.url = Url.parse('/users/2')
            req.method = 'DELETE'
            deriveRoute(req, res, (err) => {
                should(err).eql(undefined)
                req.route.path.should.eql('/users/:id')
                req.route.method.should.eql('DELETE')
                req.pathVars.id.should.eql('2')
                done()
            })
        })

        it ('should have correct pathVars on matching collision', (done) => {
            req.handler.url = Url.parse('/users/test')
            req.method = 'POST'
            deriveRoute(req, res, (err) => {
                should(err).eql(undefined)
                req.route.path.should.eql('/users/:name')
                req.route.method.should.eql('POST')
                req.pathVars.name.should.eql('test')
                done()
            })
        })

        it ('should give precedence to the active theme', (done) => {
            req.handler.url = Url.parse('/theme')
            deriveRoute(req, res, (err) => {
                should(err).eql(undefined)
                req.route.plugin.should.eql('test_theme')
                done()
            })
        })

        it ('should give precedence to sample over base', (done) => {
            req.handler.url = Url.parse('/sample')
            deriveRoute(req, res, (err) => {
                should(err).eql(undefined)
                req.route.plugin.should.eql('sample')
                done()
            })
        })

        it ('should give precedence to base over pb', (done) => {
            req.handler.url = Url.parse('/base')
            deriveRoute(req, res, (err) => {
                should(err).eql(undefined)
                req.route.plugin.should.eql('base')
                done()
            })
        })

        it ('should support pb routes', (done) => {
            req.handler.url = Url.parse('/pb')
            deriveRoute(req, res, (err) => {
                should(err).eql(undefined)
                req.route.plugin.should.eql('pencilblue')
                done()
            })
        })

        it ('should 404 when there is no match', (done) => {
            req.handler.url = Url.parse('/fake/news')
            deriveRoute(req, res, (err) => {
                err.code.should.eql(HttpStatusCodes.NOT_FOUND);
                done()
            })
        })
    })

    describe('inactiveAccessCheck', function() {

        beforeEach(function() {
            req.route = {};
            req.siteObj = {};
            req.router = {}
        });

        it('should redirect to the admin home page when: the site is inactive, inactive access is not allowed for the route, and the site is global', function(done) {
            req.siteObj.active = false;
            req.route.inactive_site_access = false;
            req.siteObj.uid = this.pb.SiteService.GLOBAL_SITE;

            req.router.redirect = sandbox.stub().withArgs('/admin');
            this.getMiddleware('inactiveAccessCheck')(req, res, () => {
                req.router.redirect.calledOnce.should.eql(true);
                done();
            });
        });

        it('should call back with a not found error when: the site is inactive, inactive access is not allowed for the route, and the site is not global', function(done) {
            req.siteObj.active = false;
            req.route.inactive_site_access = false;
            req.siteObj.uid = 'abcd';

            this.getMiddleware('inactiveAccessCheck')(req, res, function(err) {

                err.code.should.eql(HttpStatusCodes.NOT_FOUND);
                done();
            });
        });

        it('should pass the check if the site is inactive but the route allows for inactive access', function(done) {
            req.siteObj.active = false;
            req.route.inactive_site_access = true;

            this.getMiddleware('inactiveAccessCheck')(req, res, function(err) {

                should(err).eql(undefined);
                done();
            });
        });

        it('should pass the check if the site is active', function(done) {
            req.siteObj.active = true;

            this.getMiddleware('inactiveAccessCheck')(req, res, function(err) {

                should(err).eql(undefined);
                done();
            });
        });
    });

    describe('systemSetupCheck', function() {

        it('should call back with an error when the system setup check fails', function(done) {
            var expectedError = new Error('expected')
            req.route = { hello: 'world' };
            sandbox.stub(req.handler, 'checkSystemSetup').callsArgWith(1, expectedError);

            this.getMiddleware('systemSetupCheck')(req, res, function(err) {
                err.should.eql(expectedError);
                done();
            });
        });

        it('should redirect to the specified location when the check is not successful', function(done) {
            var expectedResult = {
                success: false,
                redirect: '/hello/world'
            };
            req.route = { hello: 'world' };
            req.router = { redirect: function(){}};
            sandbox.stub(req.handler, 'checkSystemSetup').callsArgWith(1, null, expectedResult);
            sandbox.stub(req.router, 'redirect').withArgs(expectedResult.redirect);

            this.getMiddleware('systemSetupCheck')(req, res, () => {
                req.router.redirect.calledOnce.should.eql(true);
                done();
            });
        });

        it('should pass the check when the check passes', function(done) {
            var expectedResult = {
                success: true
            };
            req.route = { hello: 'world' };
            sandbox.stub(req.handler, 'checkSystemSetup').callsArgWith(1, null, expectedResult);

            this.getMiddleware('systemSetupCheck')(req, res, function(err) {
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
            this.getMiddleware('requiresAuthenticationCheck')(req, res, function(err) {
                err.code.should.eql(HttpStatusCodes.UNAUTHORIZED);
                done();
            });
        });

        it('should pass the authentication check when no redirect property is set on the result', function(done) {
            var authCheckResult = {
                redirect: false
            };
            sandbox.stub(this.pb.RequestHandler, 'checkRequiresAuth').returns(authCheckResult);
            this.getMiddleware('requiresAuthenticationCheck')(req, res, function(err) {
                should(err).eql(undefined);
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
            this.getMiddleware('authorizationCheck')(req, res, function(err) {
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
            this.getMiddleware('authorizationCheck')(req, res, function(err) {
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
            this.getMiddleware('authorizationCheck')(req, res, function(err) {
                should(err).eql(undefined);
                done();
            });
        });
    });

    describe('ipFilterCheck', function() {
        let ipFilterCheck
        before(function() {
            ipFilterCheck = this.getMiddleware('ipFilterCheck');
            this.pb.config.server.ipFilter.enabled = true;
        })

        beforeEach(function() {
            req.route = {
                auth_required: true,
                path: '/admin/plugins'
            };
            sandbox.stub(this.pb.AdminIPFilter, 'requestIsAuthorized').yields(null, false)
        })

        it ('should forbid when enabled, on admin page, and not authorized', (done) => {
            ipFilterCheck(req, res, (err) => {
                err.code.should.eql(HttpStatusCodes.FORBIDDEN);
                done()
            })
        })

        it ('should allow when enabled, on admin page, and authorized', function (done) {
            this.pb.AdminIPFilter.requestIsAuthorized.yields(null, true);
            ipFilterCheck(req, res, (err) => {
                should(err).eql(undefined)
                done()
            })
        })
        it ('should allow when enabled, not on an admin page, and authorized', function (done) {
            req.route.path = '/self-service/publish';
            this.pb.AdminIPFilter.requestIsAuthorized.yields(null, false);
            ipFilterCheck(req, res, (err) => {
                should(err).eql(undefined)
                done()
            })
        })
    })
    describe('localizedRouteCheck', function() {
        let localizedRouteCheck
        before(function() {
            localizedRouteCheck = this.getMiddleware('localizedRouteCheck')
        })
        beforeEach(() => {
            req.pathVars = {
                locale: 'en-US'
            }
            req.siteObj = {
                supportedLocales: {'en-US': true, 'en-GB': true},
                defaultLocale: 'en-US'
            }
            req.url = '/en-US/somepage',
            req.router = {
                redirect: sinon.stub()
            }
        })

        it('should move on if locale is not present', (done) => {
            delete req.pathVars
            localizedRouteCheck(req, res, (err) => {
                should(err).eql(undefined)
                req.router.redirect.called.should.eql(false)
                done()
            })
        })

        it('should 404 if locale is present but invalid', (done) => {
            req.pathVars.locale = 'foobar'
            localizedRouteCheck(req, res, (err) => {
                should(err.code).eql(404)
                done()
            })
        })

        it('should continue if locale is present and supported', (done) => {
            localizedRouteCheck(req, res, (err) => {
                should(err).eql(undefined)
                req.router.redirect.called.should.eql(false)
                done()
            })
        })

        it ('should redirect to normalized locale case', (done) => {
            req.pathVars.locale = 'en-gb'
            req.url = '/en-gb/somepage'
            localizedRouteCheck(req, res, (err) => {
                should(err).eql(undefined)
                req.router.redirect.calledWith('/en-GB/somepage').should.eql(true)
                done()
            })
        })

        it ('should redirect to default if unsupported', (done) => {
            req.pathVars.locale = 'de-de'
            req.url = '/de-de/somepage'
            localizedRouteCheck(req, res, (err) => {
                should(err).eql(undefined)
                req.router.redirect.calledWith('/en-US/somepage').should.eql(true)
                done()
            })
        })
    });

    describe('instantiateController', function() {

        it('should create a new instance of the controller from the route theme properties: site, theme, HTTP method', function(done) {
            function ControllerSample(){}
            req.route = {
                controller: ControllerSample
            }
            this.getMiddleware('instantiateController')(req, res, function(err) {
                should(err).eql(undefined);
                (req.controllerInstance instanceof ControllerSample).should.eql(true);
                done();
            });
        });
    });

    describe('parseRequestBody', function() {

        it('should call back with a bad request error when the request body fails to parse', function(done) {
            var expectedError = new Error('expected');
            req.route = {
                request_body: 'application/json'
            };
            sandbox.stub(req.handler, 'parseBody')
                .withArgs(req.route.request_body, sinon.match.func)
                .callsArgWith(1, expectedError);
            this.getMiddleware('parseRequestBody')(req, res, function(err) {
                err.code.should.eql(HttpStatusCodes.BAD_REQUEST);
                should(req.body).eql(undefined);
                req.handler.parseBody.calledOnce.should.eql(true);
                done();
            });
        });

        it('should set the parsed body object on the request when the body is valid', function(done) {
            var expectedBody = { hello: 'world' };
            req.route = {
                request_body: 'application/json'
            };
            sandbox.stub(req.handler, 'parseBody')
                .withArgs(req.route.request_body, sinon.match.func)
                .callsArgWith(1, null, expectedBody);
            this.getMiddleware('parseRequestBody')(req, res, function(err) {
                should(err).eql(undefined);
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
            this.getMiddleware('initializeController')(req, res, function(err) {
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
            this.getMiddleware('initializeController')(req, res, function(err) {
                should(err).eql(undefined);
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
            req.route = { handler: 'render' };
            sandbox.stub(req.controllerInstance, 'render')
                .withArgs(sinon.match.any)
                .callsArgWith(0, expectedError);
            this.getMiddleware('render')(req, res, function(err) {
                err.should.eql(expectedError);
                done();
            });
        });

        it('should default to "render" when the handler name is not specified', function(done) {
            var expectedResult = '<html><body>Hello World!</body></html>';
            req.controllerInstance = {
                render: function(){}
            };
            req.route = {};
            sandbox.stub(req.controllerInstance, 'render')
                .withArgs(sinon.match.any)
                .callsArgWith(0, expectedResult);
            this.getMiddleware('render')(req, res, function(err) {
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
            req.route = { handler: 'doSomething' };
            sandbox.stub(req.controllerInstance, 'doSomething')
                .withArgs(sinon.match.any)
                .callsArgWith(0, expectedResult);
            this.getMiddleware('render')(req, res, function(err) {
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
            this.getMiddleware('writeSessionCookie')(req, res, function(err) {
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
            this.getMiddleware('writeSessionCookie')(req, res, function(err) {
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
            this.getMiddleware('writeSessionCookie')(req, res, function(err) {
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

            this.getMiddleware('writeResponse')(req, res, function(err) {
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

            this.getMiddleware('writeResponse')(req, res, function(err) {
                should(err).eql(undefined);
                req.handler.doRedirect.called.should.eql(false);
                req.handler.writeResponse.calledOnce.should.eql(true);
                done();
            });
        });
    });

    describe('endTime', function() {

        it('should set the end time on the request and log the interaction when: log level is debug, no redirect, and no status code', function(done) {
            req.didRedirect = false;
            req.url = '/admin/hello';
            req.controllerResult = {};
            sandbox.stub(this.pb.log, 'isDebug').returns(true);
            sandbox.stub(this.pb.log, 'debug').withArgs(sinon.match.string, sinon.match.number, req.url, '', '');

            var self = this;
            this.getMiddleware('endTime')(req, res, function(err) {
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
            this.getMiddleware('endTime')(req, res, function(err) {
                should(err).eql(undefined);
                self.pb.log.isDebug.calledOnce.should.eql(true);
                self.pb.log.debug.calledOnce.should.eql(true);
                done();
            });
        });
    });

    describe('closeSession', function() {

        it('should not attempt to close the session if no session is available on the request', function(done) {
            delete req.session;

            sandbox.stub(this.pb.session, 'close');
            var self = this;
            this.getMiddleware('closeSession')(req, res, function(err) {
                should(err).eql(undefined);
                self.pb.session.close.called.should.eql(false);
                done();
            });
        });

        it('should attempt to close the session and log the error when one is provided as an argument to the call back', function(done) {
            req.session = { hello: 'world', uid: 'abc' };
            var expectedError = new Error('expected');
            sandbox.stub(this.pb.session, 'merge')
                .withArgs(req.session.uid, sinon.match.func)
                .callsArgWith(2, expectedError);
            sandbox.stub(this.pb.log, 'warn').withArgs(sinon.match.string, req.session.uid);
            var self = this;
            this.getMiddleware('closeSession')(req, res, function(err) {
                should(err).eql(undefined);
                self.pb.session.merge.calledOnce.should.eql(true);
                self.pb.log.warn.calledOnce.should.eql(true);
                done();
            });
        });
    });

    describe('session delete', function() {
        let openSession
        let closeSession
        before(function() {
            openSession = this.getMiddleware('openSession')
            closeSession = this.getMiddleware('closeSession')
        })

        beforeEach(function(done) {
            sandbox.stub(this.pb.session, 'merge').callsArgWith(2, null, true)
            openSession(req, res, () => {
                req.session.foo = 'bar'
                done()
            })
        })

        it('should allow deletion', function(done) {
            req.session.bar = 'baz'
            req.session.delete('foo')
            req.session.delete('uid')
            req.session.should.not.have.property('foo')
            closeSession(req, res, (err) => {
                const mergeFn = this.pb.session.merge.args[0][1]
                const saved = mergeFn({foo: 'bar', uid: 'uid'})
                saved.should.have.property('uid')
                saved.should.have.property('bar')
                saved.should.not.have.property('foo')
                done()
            })
        })
    })
});

