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

module.exports = function WPManageUsersViewControllerModule(pb) {
    
    //pb dependencies
    var util          = pb.util;
    var PluginService = pb.PluginService;

    function WPManageUsersViewController() {}
    util.inherits(WPManageUsersViewController, pb.BaseController);

    WPManageUsersViewController.prototype.render = function(cb) {
        var self = this;

        if(!self.session.importedUsers) {
            this.redirect('/admin/plugins/wp_import/settings/import', cb);
            return;
        }
        else if(!self.session.importedUsers.length) {
            this.redirect('/admin/plugins/wp_import/settings/import', cb);
            return;
        }

        var newUsers = false;
        for(var i = 0; i < self.session.importedUsers.length; i++) {
            if(self.session.importedUsers[i].generatedPassword) {
                newUsers = true;
                break;
            }
        }
        if(!newUsers) {
            this.redirect('/admin/plugins/wp_import/settings/import', cb);
            return;
        }


        var tabs = [
            {
                active: 'active',
                href: '#users',
                icon: 'users',
                title: self.ls.get('USERS')
            }
        ];

        var pills = [
        {
            name: 'content_settings',
            title: self.ls.get('MANAGE_NEW_USERS'),
            icon: 'chevron-left',
            href: '/admin/plugins/wp_import/settings'
        }];

        var objects = {
            navigation: pb.AdminNavigation.get(self.session, ['plugins', 'manage'], self.ls, self.site),
            pills: pills,
            tabs: tabs,
            users: self.session.importedUsers,
            adminOptions: pb.users.getAdminOptions(self.session, self.localizationService)
        };

        this.setPageName(this.ls.get('IMPORT_WORDPRESS'));
        var angularObjects = pb.ClientJs.getAngularObjects(objects);
        self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
        self.ts.load('/admin/plugins/settings/wp_import/manage_new_users', function(err, result) {

            var content = {
                content: result,
                content_type: "text/html",
                code: 200
            };
            cb(content);
        });
    };

    WPManageUsersViewController.getRoutes = function(cb) {
        var routes = [
            {
                method: 'get',
                path: '/admin/plugins/wp_import/settings/manage_new_users',
                auth_required: true,
                inactive_site_access: true,
                access_level: pb.SecurityService.ACCESS_MANAGING_EDITOR,
                content_type: 'text/html'
            }
        ];
        cb(null, routes);
    };

    //exports
    return WPManageUsersViewController;
};
