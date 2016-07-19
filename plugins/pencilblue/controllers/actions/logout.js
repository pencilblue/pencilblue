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

//dependencies
var Cookies = require('cookies');

module.exports = function(pb) {

    //pb dependencies
    var util            = pb.util;
    var BaseController  = pb.BaseController;
    var SecurityService = pb.SecurityService;

    /**
     * Logs a user out of the system
     * @class LogoutController
     * @constructor
     * @extends {BaseController}
     */
    function LogoutController(){}
    util.inherits(LogoutController, BaseController);

    LogoutController.prototype.render = function(cb) {
        var self = this;
        pb.session.end(this.session, function(err, result){

            //clear the cookie
            var cookies      = new Cookies(self.req, self.res);
            var cookie       = pb.SessionHandler.getSessionCookie(self.session);
            cookie.expires   = new Date();
            cookie.overwrite = true;
            cookies.set(pb.SessionHandler.COOKIE_NAME, null, cookie);

            //send redirect
            self.redirect(self.getRedirect(), cb);
        });
    };

    /**
     * Determines how to redirect the user once the session is destroyed.  If
     * the user has elevated privileges he/she is redirected to the admin login.
     * If it is a regular user they are redirected back to the referring URL.
     * Finally, if niether of those hold true they are redirected back to the
     * home page.
     * @method getRedirect
     * @return {String} The URL string to redirect to
     */
    LogoutController.prototype.getRedirect = function() {

        //admins always go back to admin login.  Looking at the referer would
        //be a security risk because once logged back in the user would be
        //automatically redirected right back to where the previous session
        //left off.
        if (SecurityService.isAuthorized(this.session, { admin_level: SecurityService.ACCESS_WRITER })) {
            return '/admin/login';
        }

        //check for a valid referer
        var redirect = this.req.headers.referer;
        if (!util.isNullOrUndefined(redirect)) {
            return redirect;
        }

        //when all else fails, go to the home page
        return '/';
    };

    //exports
    return LogoutController;
};
