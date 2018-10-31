const passport = require('koa-passport');

module.exports = function LoginSFActionControllerModule(pb) {

    /**
     * Authenticates a user
     * @class LoginActionController
     * @constructor
     * @extends FormController
     */
    class LoginSFActionController extends pb.BaseController {
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


        async _doLogin(cb) {
            this.ctx.request.querystring = '';

            await passport.authenticate('salesforce')(this.ctx);
            let redirectLink = this.ctx.res.getHeader('location') || '';
            if(redirectLink) {
                this.redirect(redirectLink, cb);
            }
            else {
                throw pb.Errors.notAuthorized('Not Authorized');
            }
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
    return LoginSFActionController;
};
