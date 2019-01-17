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

module.exports = function LoginActionControllerModule(pb) {

    //dependencies
    var util               = pb.util;
    var FormController     = pb.FormController;
    var FormAuthentication = pb.FormAuthentication;

    /**
     * Authenticates a user
     * @class LoginActionController
     * @constructor
     * @extends FormController
     */
    function LoginActionController(){}
    util.inherits(LoginActionController, FormController);

    /**
     *
     * @method onPostParamsRetrieved
     * @param {Object} post
     * @param {Function} cb
     */
    LoginActionController.prototype.onPostParamsRetrieved = function(post, cb) {
        var self         = this;
        var adminAttempt = this.query.admin_attempt ? true : false;

        var options = post;
        options.access_level = adminAttempt ? pb.SecurityService.ACCESS_WRITER : pb.SecurityService.ACCESS_USER;
        options.site = self.site;
        pb.security.authenticateSession(this.session, options, new FormAuthentication(), function(err, user) {
            if(util.isError(err) || user === null)  {
                self.loginError(adminAttempt, cb);
                return;
            }

            //redirect
            var location = '/';
            if (self.session.on_login !== undefined) {
                location = self.session.on_login;
                delete self.session.on_login;
            }
            else if(adminAttempt) {
                location = '/admin';
            }
            self.redirect(location, cb);
        });
    };

    LoginActionController.prototype.loginError = function(adminAttempt, cb) {
        this.session.error = this.ls.g('login.INVALID_LOGIN');
        if(adminAttempt){
            this.redirect('/admin/login', cb);
            return;
        }

        this.redirect('/user/login', cb);
    };

    //exports
    return LoginActionController;
};
