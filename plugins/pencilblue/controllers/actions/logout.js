/*
    Copyright (C) 2015  PencilBlue, LLC

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

//dependencies
var Cookies = require('cookies');

module.exports = function LogoutModule(pb) {
    
    //pb dependencies
    var util = pb.util;
    
    /**
     * Logs a user out of the system
     */
    function Logout(){}
    util.inherits(Logout, pb.BaseController);

    Logout.prototype.render = function(cb) {
        var self = this;
        pb.session.end(this.session, function(err, result){

            //clear the cookie
            var cookies      = new Cookies(self.req, self.res);
            var cookie       = pb.SessionHandler.getSessionCookie(self.session);
            cookie.expires   = new Date();
            cookie.overwrite = true;
            cookies.set(pb.SessionHandler.COOKIE_NAME, null, cookie);

            //send redirect
            self.redirect('/', cb);
        });
    };

    //exports
    return Logout;
};
