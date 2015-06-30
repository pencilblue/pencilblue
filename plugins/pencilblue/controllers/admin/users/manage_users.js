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

module.exports = function(pb) {
    
    //pb dependencies
    var util = pb.util;
    
    /**
     * Interface for managing users
     */
    function ManageUsers(){}
    util.inherits(ManageUsers, pb.BaseAdminController);

    //statics
    var SUB_NAV_KEY = 'manage_users';

    ManageUsers.prototype.render = function(cb) {
        var self = this;

        //TODO: see if there is a user service function with this
        var opts = {
            where: {
                admin: {$lte: self.session.authentication.user.admin}
            }
        };

        self.siteQueryService.q('user', opts, function(err, users) {
            if(util.isError(err)) {
                return self.reqHandler.serveError(err);
            }
            else if (users.length === 0) {
                return self.redirect('/admin/users/new', cb);
            }

            var angularObjects = pb.ClientJs.getAngularObjects({
                navigation: pb.AdminNavigation.get(self.session, ['users', 'manage'], self.ls, self.site),
                pills: self.getAdminPills(SUB_NAV_KEY, self.ls, SUB_NAV_KEY),
                users: users,
                currentUserId: self.session.authentication.user_id
            });

            self.setPageName(self.ls.get('MANAGE_USERS'));
            self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
            self.ts.load('admin/users/manage_users', function(err, result){
                cb({content: result});
            });
        });
    };

    ManageUsers.getSubNavItems = function(key, ls, data) {
        return [{
            name: 'manage_users',
            title: ls.get('MANAGE_USERS'),
            icon: 'refresh',
            href: '/admin/users'
        }, {
            name: 'unverified_users',
            title: ls.get('UNVERIFIED_USERS'),
            icon: 'user',
            href: '/admin/users/unverified'
        }, {
            name: 'new_user',
            title: '',
            icon: 'plus',
            href: '/admin/users/new'
        }];
    };

    //register admin sub-nav
    pb.AdminSubnavService.registerFor(SUB_NAV_KEY, ManageUsers.getSubNavItems);

    //exports
    return ManageUsers;
};
