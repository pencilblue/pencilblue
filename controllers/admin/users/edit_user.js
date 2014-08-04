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
 * Interface for editing a user
 */

function EditUser(){}

//dependencies
var Users = require('../users');

//inheritance
util.inherits(EditUser, pb.BaseController);

//statics
var SUB_NAV_KEY = 'edit_user';

EditUser.prototype.render = function(cb) {
	var self = this;
	var vars = this.pathVars;
    if(!vars.id) {
        this.redirect('/admin/users/manage_users', cb);
        return;
    }

    var dao = new pb.DAO();
    dao.loadById(vars.id, 'user', function(err, user) {
        if(util.isError(err) || user === null) {
            self.redirect('/admin/users/manage_users', cb);
            return;
        }

        var tabs = [
            {
                active: 'active',
                href: '#account_info',
                icon: 'cog',
                title: self.ls.get('ACCOUNT_INFO')
            },
            {
                href: '#personal_info',
                icon: 'user',
                title: self.ls.get('PERSONAL_INFO')
            }
        ];

        // Administrators can't downgrade themselves
        var adminOptions = [{name: self.ls.get('ADMINISTRATOR'), value: ACCESS_ADMINISTRATOR}];
        if(self.session.authentication.user_id != user._id.toString()) {
            adminOptions = pb.users.getAdminOptions(self.session, self.localizationService);
        }

        var angularData = pb.js.getAngularController(
        {
            navigation: pb.AdminNavigation.get(self.session, ['users'], self.ls),
            pills: pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, SUB_NAV_KEY, {session: self.session, user: user}),
            tabs: tabs,
            adminOptions: adminOptions,
            user: user
        });

        delete user.password;
        self.setPageName('Edit User');
        self.ts.registerLocal('user_id', user._id);
        self.ts.registerLocal('image_title', self.ls.get('USER_PHOTO'));
        self.ts.registerLocal('uploaded_image', (user.photo ? user.photo : ''));
        self.ts.registerLocal('angular_script', angularData);
        self.ts.load('admin/users/edit_user', function(err, data) {
            var result = '' + data;
            cb({content: result});
        });
    });
};

EditUser.getSubNavItems = function(key, ls, data) {
	var pills = Users.getPillNavOptions();
    if(data.session.authentication.user_id == data.user._id.toString()) {
        pills.unshift(
        {
            name: 'change_password',
            title: ls.get('CHANGE_PASSWORD'),
            icon: 'key',
            href: '/admin/users/change_password/' + data.user._id.toString()
        });
    }
    else if(data.session.authentication.admin_level >= ACCESS_MANAGING_EDITOR) {
        pills.unshift(
        {
            name: 'reset_password',
            title: ls.get('RESET_PASSWORD'),
            icon: 'key',
            href: '/actions/admin/users/send_password_reset/' + data.user._id.toString()
        });
    }
    pills.unshift(
    {
        name: 'manage_users',
        title: data.user.username,
        icon: 'chevron-left',
        href: '/admin/users/manage_users'
    });
    return pills;
};

//register admin sub-nav
pb.AdminSubnavService.registerFor(SUB_NAV_KEY, EditUser.getSubNavItems);

//exports
module.exports = EditUser;
