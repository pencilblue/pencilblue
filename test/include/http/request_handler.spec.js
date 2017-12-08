
//dependencies
var url = require('url');
var should = require('should');
var HttpStatusCodes = require('http-status-codes');
var TestHelpers = require('../../test_helpers');

describe('RequestHandler', function() {

    TestHelpers.registerReset();

    describe('buildControllerContext', function() {

        it('should build out the controller context and merge in any extra properties', function() {
            var req = {
                handler: { req: 'handler', url: url.parse('https://localhost:8080/admin?q=42')},
                localizationService: { localization: 'service'},
                pathVars: { a: 'b', c: 'd'},
                path_vars: { a: 'b', c: 'd'},
                query: {q: 'find something'},
                body: null,
                site: 'global',
                siteObj: {
                    displayName: 'Global'
                },
                siteName: 'Global',
                activeTheme: 'portfolio',
                routeTheme: {
                    localization: false
                }
            };
            var res = {
                session: { uid: 'abcd-user'}
            };
            var extraProps = {
                extra: 'prop',
                extra2: false
            };
            var expected = {
                request_handler: req.handler,
                request: req,
                response: res,
                session: req.session,
                localization_service: req.localizationService,
                path_vars: req.pathVars,
                pathVars: req.pathVars,
                query: req.handler.url.query,
                body: req.body,
                site: req.site,
                siteObj: req.siteObj,
                siteName: req.siteName,
                activeTheme: req.activeTheme,
                routeLocalized: !!req.routeTheme.localization,
                extra: extraProps.extra,
                extra2: extraProps.extra2
            };

            this.pb.RequestHandler.buildControllerContext(req, res, extraProps).should.eql(expected);
        });
    });

    describe('checkRequiresAuth', function() {

        var ctx, expected;
        beforeEach(function() {
            ctx = {
                route: {
                    auth_required: true
                },
                session: {
                    authentication: {
                        user_id: 'abcdedft'
                    }
                },
                url: url.parse('http://localhost:8080/'),
                req: {
                    method: 'get'
                }
            };
            expected = { success: true };
        });

        it('should return a successful result when authentication is not required for a route', function() {
            ctx.route.auth_required = false;
            this.pb.RequestHandler.checkRequiresAuth(ctx).should.eql(expected);
        });

        it('should return a successful result when authentication is required and the userId is not null or undefined', function() {
            this.pb.RequestHandler.checkRequiresAuth(ctx).should.eql(expected);
        });

        it('should return an invalid result when authentication is required and the user id is null', function() {
            ctx.session.authentication.user_id = null;
            expected.redirect = '/user/login';
            expected.success = false;
            this.pb.RequestHandler.checkRequiresAuth(ctx).should.eql(expected);
            ctx.session.on_login.should.eql(ctx.url.href);
        });

        it('should return an invalid result when authentication is required and the user id is undefined', function() {
            ctx.session.authentication.user_id = null;
            ctx.req.method = 'post';
            ctx.url = url.parse('http://localhost:8080/admin/content/articles');
            expected.redirect = '/admin/login';
            expected.success = false;
            this.pb.RequestHandler.checkRequiresAuth(ctx).should.eql(expected);
            ctx.session.on_login.should.eql('http://localhost:8080/admin');
        });
    });

    describe('isAdminUrl', function() {

        [
            {v: null, e: false},
            {v: '', e: false},
            {v: '/', e: false},
            {v: '/false', e: false},
            {v: 'https://localhost:8080/', e: false},
            {v: 'https://localhost:8080/what/about/admin', e: false},
            {v: 'http://localhost:8080/admin/hello', e: false},
            {v: 'http://localhost:8080/admin', e: false},
            {v: 'http://localhost:8080/admin/', e: false},
            {v: '/admin/', e: true},
            {v: '/admin', e: true},
            {v: 'admin/', e: true},
            {v: 'admin', e: true}
        ].forEach(function(testCase) {
            it ('should return '+testCase.e+' when determining if '+testCase.v+' is an Admin URL', function() {
                this.pb.RequestHandler.isAdminURL(testCase.v).should.eql(testCase.e);
            });
        });
    });

    describe('checkAdminLevel', function() {

        var ctx, expected;
        beforeEach(function() {
            ctx = {
                route: {
                    access_level: this.pb.SecurityService.ACCESS_EDITOR
                },
                session: {
                    authentication: {
                        admin_level: this.pb.SecurityService.ACCESS_MANAGING_EDITOR
                    }
                }
            };
            expected = { success: true };
        });

        it('should return a successful result when the route does not require a specified role level', function() {
            delete ctx.route.access_level;
            this.pb.RequestHandler.checkAdminLevel(ctx).should.eql(expected);
        });

        it('should return a successful result when the user has a more or equally elevated role level than the route requires', function() {
            this.pb.RequestHandler.checkAdminLevel(ctx).should.eql(expected);
        });

        it('should return an unsuccessful result when the route has a more elevated role level than the user', function() {
            ctx.route.access_level = this.pb.SecurityService.ACCESS_ADMINISTRATOR;
            expected.success = false;
            expected.content = '403 Forbidden';
            expected.code = HttpStatusCodes.FORBIDDEN;
            this.pb.RequestHandler.checkAdminLevel(ctx).should.eql(expected);
        })
    });

    describe('checkPermissions', function() {

        var ctx, expected;
        beforeEach(function() {
            ctx = {
                route: {
                    permissions: ['sample-1']
                },
                session: {
                    authentication: {
                        admin_level: this.pb.SecurityService.ACCESS_MANAGING_EDITOR,
                        user: {
                            permissions: {
                                'sample-1': true
                            }
                        }
                    }
                }
            };
            expected = { success: true };
        });

        it('should return a successful result when the session does not contain an authentication object', function() {
            delete ctx.session.authentication;
            this.pb.RequestHandler.checkPermissions(ctx).should.eql(expected);
        });

        it('should return a successful result when session.authentication.user is not an object', function() {
            delete ctx.session.authentication.user;
            this.pb.RequestHandler.checkPermissions(ctx).should.eql(expected);
        });

        it('should return a successful result when the user is an administrator (assumed to have all rights)', function() {
            ctx.session.authentication.admin_level = this.pb.SecurityService.ACCESS_ADMINISTRATOR;
            this.pb.RequestHandler.checkPermissions(ctx).should.eql(expected);
        });

        it('should return a successful result when the user is not assigned any permissions', function() {
            delete ctx.session.authentication.user.permissions;
            this.pb.RequestHandler.checkPermissions(ctx).should.eql(expected);
        });

        it('should return a successful result when the route is not assigned any permissions', function() {
            delete ctx.route.permissions;
            this.pb.RequestHandler.checkPermissions(ctx).should.eql(expected);
        });

        it('should return a successful result when the route\'s permissions are a sub-set of the user\'s permissions', function() {
            this.pb.RequestHandler.checkPermissions(ctx).should.eql(expected);
        });

        it('should return an unsuccessful result when the route\'s permissions are not a sub-set of the user\'s permissions', function() {
            ctx.session.authentication.user.permissions = {};
            expected.success = false;
            expected.content = '403 Forbidden';
            expected.code = HttpStatusCodes.FORBIDDEN;
            this.pb.RequestHandler.checkPermissions(ctx).should.eql(expected);
        });
    });

    describe('getMimeFromPath', function() {

        var mimeMap = {
            js: 'application/javascript',
            css: 'text/css',
            png: 'image/png',
            svg: 'image/svg+xml',
            jpg: 'image/jpeg',
            gif: 'image/gif',
            webp: 'image/webp',
            ico: 'image/x-icon',
            tff: 'application/octet-stream',
            eot: 'application/vnd.ms-fontobject',
            woff: 'font/woff',
            otf: 'font/otf',
            ttf: 'font/ttf',
            pdf: 'application/pdf',
            html: 'text/html',
            notanext: 'application/octet-stream'
        };
        Object.keys(mimeMap).forEach(function(ext) {

            it('should map the extension '+ext+' to mime type '+mimeMap[ext], function() {
                this.pb.RequestHandler.getMimeFromPath('/file.'+ext).should.eql(mimeMap[ext]);
            });
        });
    });
});
