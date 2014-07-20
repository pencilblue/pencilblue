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

function UnverifiedUsers(){}

//dependencies
var Users = require('../users');

//inheritance
util.inherits(UnverifiedUsers, pb.BaseController);

//statics
var SUB_NAV_KEY = 'unverified_users';

UnverifiedUsers.prototype.render = function(cb) {
    var self = this;
    var dao  = new pb.DAO();
    dao.query('unverified_user', {}).then(function(users) {
        if(util.isError(users)) {
            self.redirect('/admin', cb);
            return;
        }

        var angularData = pb.js.getAngularController(
        {
            navigation: pb.AdminNavigation.get(self.session, ['users', 'manage'], self.ls),
            pills: pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, SUB_NAV_KEY),
            users: users
        }, [], 'initUsersPagination()');

        self.setPageName(self.ls.get('MANAGE_USERS'));
        self.ts.registerLocal('angular_script', angularData);
        self.ts.load('admin/users/unverified_users', function(err, data){
            var result = '' + data;
            cb({content: result});
        });
    });
};

UnverifiedUsers.getSubNavItems = function(key, ls, data) {
    var pills = Users.getPillNavOptions();
    pills.unshift(
    {
        name: 'unverified_users',
        title: ls.get('UNVERIFIED_USERS'),
        icon: 'chevron-left',
        href: '/admin/users/manage_users'
    });
    return pills;
};

//register admin sub-nav
pb.AdminSubnavService.registerFor(SUB_NAV_KEY, UnverifiedUsers.getSubNavItems);

//exports
module.exports = UnverifiedUsers;
