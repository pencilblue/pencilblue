/*
    Copyright (C) 2016  PencilBlue, LLC

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
'use strict';

const passport = require('koa-passport');

module.exports = function LoginActionControllerModule(pb) {

    //dependencies
    var FormController     = pb.FormController;

    /**
     * Authenticates a user
     * @class LoginActionController
     * @constructor
     * @extends FormController
     */
    class LoginActionController extends pb.BaseController {
        render (cb) {
            this.sanitizeObject(this.body);
            this._setupLoginContext();
            this._doLogin(cb);
        }
        loginError (cb) {
            this.session.error = this.ls.g('login.INVALID_LOGIN');
            if(this.isAdminLogin){
                return this.redirect('/admin/login', cb);
            }

            return this.redirect('/user/login', cb);
        };


        _doLogin (cb) {
            let redirectLocation = this.redirectLink;

            return passport.authenticate('custom', (err, user) => {
                if (!user) {
                    return this.loginError(this.isAdminLogin, cb);
                }
                this.redirect(redirectLocation, cb);
            })(this.ctx);
        }

        _setupLoginContext () {
            let options = this.body;
            options.access_level = this.isAdminLogin ? pb.SecurityService.ACCESS_WRITER : pb.SecurityService.ACCESS_USER;
            options.site = this.site;
            this.ctx.session._loginContext = options;
        }

        get isAdminLogin () {
            return !!this.query.admin_attempt;
        }
        get redirectLink () {
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
    return LoginActionController;
};
