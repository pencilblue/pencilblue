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
 * Interface for changing the logged in user's password
 */

function ChangePasswordController(){}

//inheritance
util.inherits(ChangePasswordController, pb.BaseController);

//statics
var SUB_NAV_KEY = 'change_password';

ChangePasswordController.prototype.render = function(cb) {
	var self = this;
	var vars = this.pathVars;
    if(!vars.id) {
        this.redirect('/admin/users', cb);
        return;
    }
    if(self.session.authentication.user_id != vars.id) {
        this.redirect('/admin/users', cb);
        return;
    }

    var dao = new pb.DAO();
    dao.loadById(vars.id, 'user', function(err, user) {
        if(util.isError(err) || user === null) {
            self.redirect('/admin/users', cb);
            return;
        }

        var tabs = [{
            active: 'active',
            href: '#password',
            icon: 'key',
            title: self.ls.get('PASSWORD')
        }];

        var angularObjects = pb.js.getAngularObjects(
        {
            navigation: pb.AdminNavigation.get(self.session, ['users'], self.ls),
            pills: pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, SUB_NAV_KEY, user),
            tabs: tabs,
            adminOptions: pb.users.getAdminOptions(self.session, self.localizationService),
            user: user
        });

        delete user.password;
        self.setPageName(self.ls.get('CHANGE_PASSWORD'));
        self.ts.registerLocal('angular_script', '');
		self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
        self.ts.load('admin/users/change_password', function(err, result) {
            cb({content: result});
        });
    });
};

ChangePasswordController.getSubNavItems = function(key, ls, data) {
	return [
        {
            name: SUB_NAV_KEY,
            title: ls.get('CHANGE_PASSWORD'),
            icon: 'chevron-left',
            href: '/admin/users/' + data._id
        }
   ];
};

//register admin sub-nav
pb.AdminSubnavService.registerFor(SUB_NAV_KEY, ChangePasswordController.getSubNavItems);

//exports
module.exports = ChangePasswordController;
