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
 * Interface for creating a new user
 */

function NewUser(){}

//var dependencies
var Users = require('../users');

//inheritance
util.inherits(NewUser, pb.BaseController);

//statics
var SUB_NAV_KEY = 'new_user';

NewUser.prototype.render = function(cb) {
	var self = this;

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

    var angularData = pb.js.getAngularController(
    {
        navigation: pb.AdminNavigation.get(self.session, ['users'], self.ls),
        pills: pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, SUB_NAV_KEY),
        tabs: tabs,
        adminOptions: pb.users.getAdminOptions(self.session, self.localizationService),
    });

	this.setPageName(self.ls.get('NEW_USER'));
	this.ts.registerLocal('image_title', this.ls.get('USER_PHOTO'));
	this.ts.registerLocal('uploaded_image', '');
    this.ts.registerLocal('angular_script', angularData);
	this.ts.load('admin/users/new_user', function(err, data) {
        var result = '' + data;
        cb({content: result});
    });
};

NewUser.getSubNavItems = function(key, ls, data) {
	var pills = Users.getPillNavOptions();
    pills.unshift(
    {
        name: 'manage_users',
        title: ls.get('NEW_USER'),
        icon: 'chevron-left',
        href: '/admin/users/manage_users'
    });
    return pills;
};

//register admin sub-nav
pb.AdminSubnavService.registerFor(SUB_NAV_KEY, NewUser.getSubNavItems);

//exports
module.exports = NewUser;
