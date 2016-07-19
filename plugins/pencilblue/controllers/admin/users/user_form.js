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

//dependencies
var async = require('async');

module.exports = function(pb) {

    //pb dependencies
    var util = pb.util;

    /**
     * Interface for editing a user
     */
    function UserForm(){}
    util.inherits(UserForm, pb.BaseAdminController);

    //statics
    var SUB_NAV_KEY = 'user_form';

    UserForm.prototype.render = function(cb) {
        var self = this;
        var vars = this.pathVars;

        this.gatherData(vars, function(err, data) {
            if(util.isError(err)) {
                throw err;
            }
            else if(!data.user) {
                self.reqHandler.serve404();
                return;
            }

            self.user = data.user;
            data.pills = self.getAdminPills(SUB_NAV_KEY, self.ls, SUB_NAV_KEY, {session: self.session, user: self.user});

            data.adminOptions = [{name: self.ls.g('generic.ADMINISTRATOR'), value: pb.SecurityService.ACCESS_ADMINISTRATOR}];
            if(!data.user[pb.DAO.getIdField()] || self.session.authentication.user_id !== data.user[pb.DAO.getIdField()].toString()) {
                var userService = new pb.UserService(self.getServiceContext());
                data.adminOptions = userService.getAdminOptions(self.session, self.localizationService);
            }

            var angularObjects = pb.ClientJs.getAngularObjects(data);

            self.setPageName(data.user[pb.DAO.getIdField()] ? data.user.username : self.ls.g('users.NEW_USER'));
            self.ts.registerLocal('image_title', self.ls.g('users.USER_PHOTO'));
            self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
            self.ts.load('admin/users/user_form', function(err, result) {
                cb({content: result});
            });
        });
    };

    UserForm.prototype.gatherData = function(vars, cb) {
        var self = this;
        var tasks = {
            tabs: function(callback) {
                var tabs = [{
                    active: 'active',
                    href: '#account_info',
                    icon: 'cog',
                    title: self.ls.g('users.ACCOUNT_INFO')
                }, {
                    href: '#personal_info',
                    icon: 'user',
                    title: self.ls.g('users.PERSONAL_INFO')
                }];
                callback(null, tabs);
            },

            navigation: function(callback) {
                callback(null, pb.AdminNavigation.get(self.session, ['users'], self.ls, self.site));
            },

            user: function(callback) {
                if(!vars.id) {
                    callback(null, {});
                    return;
                }

                self.siteQueryService.loadById(vars.id, 'user', function(err, user) {
                    delete user.password;
                    callback(err, user);
                });
            },

            locales: function(callback) {
                callback(null, pb.Localization.getSupportedWithDisplay());
            }
        };
        async.series(tasks, cb);
    };

    UserForm.getSubNavItems = function(key, ls, data) {
        var pills = [{
            name: 'manage_users',
            title: data.user[pb.DAO.getIdField()] ? ls.g('generic.EDIT') + ' ' + data.user.username : ls.g('users.NEW_USER'),
            icon: 'chevron-left',
            href: '/admin/users'
        }];

        if(data.user[pb.DAO.getIdField()]) {
            if(data.session.authentication.user_id === data.user[pb.DAO.getIdField()].toString()) {
                pills.push({
                    name: 'change_password',
                    title: ls.g('users.CHANGE_PASSWORD'),
                    icon: 'key',
                    href: '/admin/users/password/' + data.user[pb.DAO.getIdField()].toString()
                });
            }
            else if(data.session.authentication.admin_level >= pb.SecurityService.ACCESS_MANAGING_EDITOR) {
                pills.push({
                    name: 'reset_password',
                    title: ls.g('users.RESET_PASSWORD'),
                    icon: 'key',
                    href: '/actions/admin/users/send_password_reset/' + data.user[pb.DAO.getIdField()].toString()
                });
            }
        }

        pills.push({
            name: 'new_user',
            title: '',
            icon: 'plus',
            href: '/admin/users/new'
        });

        return pills;
    };

    //register admin sub-nav
    pb.AdminSubnavService.registerFor(SUB_NAV_KEY, UserForm.getSubNavItems);

    //exports
    return UserForm;
}
