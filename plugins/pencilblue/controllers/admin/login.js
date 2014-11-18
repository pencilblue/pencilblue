/*
    Copyright (C) 2014  PencilBlue, LLC

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

/**
 * Interface for admin login
 */

function Login(){}

//inheritance
util.inherits(Login, pb.BaseController);


Login.prototype.render = function(cb) {


    if(pb.security.isAuthorized(this.session, {authenticated: true, admin_level: ACCESS_WRITER})) {
        this.redirect('/admin', cb);
        return;
    }
    else if(pb.security.isAuthenticated(this.session)) {
        this.redirect('/', cb);
        return;
    }

    this.setPageName(' ' + this.ls.get('LOGIN'));
    this.templateService.load('admin/login',  function(err, data) {
    	cb({content: data});
    });
};

//exports
module.exports = Login;
