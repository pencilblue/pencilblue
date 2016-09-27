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

module.exports = function AdminChangePasswordControllerModule(pb) {

    //pb dependencies
    var util = pb.util;
    var UserService = pb.UserService;

    /**
     * Interface for changing the logged in user's password
     * @class AdminChangePasswordController
     * @constructor
     * @extends BaseController
     */
    function AdminChangePasswordController(){}
    util.inherits(AdminChangePasswordController, pb.BaseAdminController);

    //statics
    var SUB_NAV_KEY = 'change_password';

    /**
     * Initializes the controller
     * @method init
     * @param {Object} context
     * @param {Function} cb
     */
    AdminChangePasswordController.prototype.init = function(context, cb) {
        var self = this;
        var init = function(err) {

            /**
             * @property service
             * @type {UserService}
             */
            self.service = new UserService(self.getServiceContext());

            cb(err, true);
        };
        AdminChangePasswordController.super_.prototype.init.apply(this, [context, init]);
    };

    AdminChangePasswordController.prototype.render = function(cb) {
        var self = this;
        var vars = this.pathVars;

        if(!pb.validation.isIdStr(vars.id, true)) {
            return self.reqHandler.serve404();
        }
        if(self.session.authentication.user_id != vars.id) {
            this.redirect('/admin/users', cb);
            return;
        }

        self.siteQueryService.loadById(vars.id, 'user', function(err, user) {
            if(util.isError(err) || user === null) {
                self.redirect('/admin/users', cb);
                return;
            }

            var tabs = [{
                active: 'active',
                href: '#password',
                icon: 'key',
                title: self.ls.g('users.PASSWORD')
            }];

            var angularObjects = pb.ClientJs.getAngularObjects(
            {
                navigation: pb.AdminNavigation.get(self.session, ['users'], self.ls, self.site),
                pills: pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, SUB_NAV_KEY, user),
                tabs: tabs,
                adminOptions: self.service.getAdminOptions(self.session, self.localizationService),
                user: user
            });

            delete user.password;
            self.setPageName(self.ls.g('users.CHANGE_PASSWORD'));
            self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
            self.ts.load('admin/users/change_password', function(err, result) {
                cb({content: result});
            });
        });
    };

    AdminChangePasswordController.getSubNavItems = function(key, ls, data) {
        return [
            {
                name: SUB_NAV_KEY,
                title: ls.g('users.CHANGE_PASSWORD'),
                icon: 'chevron-left',
                href: pb.UrlService.urlJoin('/admin/users/', encodeURIComponent(data[pb.DAO.getIdField()]))
            }
       ];
    };

    //register admin sub-nav
    pb.AdminSubnavService.registerFor(SUB_NAV_KEY, AdminChangePasswordController.getSubNavItems);

    //exports
    return AdminChangePasswordController;
};
