'use strict';

const passport = require('koa-passport');

module.exports = function LoginSalesforceCallbackControllerModule(pb) {

    //dependencies
    var FormController = pb.FormController;

    /**
     * Authenticates a user
     * @class LoginSalesforceCallbackController
     * @constructor
     * @extends FormController
     */
    class LoginSalesforceCallbackController extends pb.BaseController {
        render(cb) {
            this.sanitizeObject(this.body);
            this._setupLoginContext();
            this._doLogin(cb);
        }
        loginError(cb) {
            this.session.error = this.ls.g('login.INVALID_LOGIN');
            if (this.isAdminLogin) {
                return this.redirect('/admin/login', cb);
            }

            return this.redirect('/user/login', cb);
        };


        _doLogin(cb) {
            this.ctx.__site = this.site;
            let redirectLocation = this.redirectLink;
            return passport.authenticate('salesforce-callback', (err, user) => {
                if (!user) {
                    return this.loginError(cb);
                }
                this.redirect(redirectLocation, cb);
            })(this.ctx);
        }

        _setupLoginContext() {
            let options = this.body;
            options.access_level = this.isAdminLogin ? pb.SecurityService.ACCESS_WRITER : pb.SecurityService.ACCESS_USER;
            options.site = this.site;
            this.ctx.session._loginContext = options;
        }

        get isAdminLogin() {
            return !!this.query.admin_attempt;
        }
        get redirectLink() {
            let location = '/';
            if (this.session.on_login) {
                location = this.session.on_login;
                delete this.session.on_login;
            } else if (this.isAdminLogin) {
                location = '/admin';
            }
            return location;
        }
    }

    //exports
    return LoginSalesforceCallbackController;
};