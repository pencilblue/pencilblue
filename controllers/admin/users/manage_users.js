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
 * Interface for managing users
 */

function ManageUsers(){}

//dependencies
var Users = require('../users');

//inheritance
util.inherits(ManageUsers, pb.BaseController);

//statics
var SUB_NAV_KEY = 'manage_users';

ManageUsers.prototype.render = function(cb) {
	var self = this;
	var dao  = new pb.DAO();
	dao.query('user', {admin: {$lte: self.session.authentication.user.admin}}).then(function(users) {
        if(util.isError(users) || users.length === 0) {
            self.redirect('/admin', cb);
            return;
        }

        var angularData = pb.js.getAngularController(
        {
            navigation: pb.AdminNavigation.get(self.session, ['users', 'manage'], self.ls),
            pills: pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, SUB_NAV_KEY),
            users: users,
            currentUserId: self.session.authentication.user_id
        }, [], 'initUsersPagination()');

        self.setPageName(self.ls.get('MANAGE_USERS'));
        self.ts.registerLocal('angular_script', angularData);
        self.ts.load('admin/users/manage_users', function(err, data){
            var result = '' + data;
            cb({content: result});
        });
    });
};

ManageUsers.getSubNavItems = function(key, ls, data) {
	var pills = Users.getPillNavOptions();
    pills.unshift(
    {
        name: 'unverified_users',
        title: ls.get('UNVERIFIED_USERS'),
        icon: 'user',
        href: '/admin/users/unverified_users'
    });
    pills.unshift(
    {
        name: 'manage_users',
        title: ls.get('MANAGE_USERS'),
        icon: 'refresh',
        href: '/admin/users/manage_users'
    });
    return pills;
};

//register admin sub-nav
pb.AdminSubnavService.registerFor(SUB_NAV_KEY, ManageUsers.getSubNavItems);

//exports
module.exports = ManageUsers;
