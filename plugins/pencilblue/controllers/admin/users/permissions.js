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

module.exports = function(pb) {

    //pb dependencies
    var util = pb.util;
    var BaseAdminController = pb.BaseAdminController;

    /**
     * Interface for displaying how a plugin's user permissions are organized
     */
    function PermissionsMapController(){}
    util.inherits(PermissionsMapController, BaseAdminController);

    PermissionsMapController.prototype.render = function(cb) {
        var self = this;

        //setup angular
        var roleDNMap   = pb.security.getRoleToDisplayNameMap(this.ls);
        var roles       = Object.keys(roleDNMap);
        var roleDNs     = Object.keys(util.invertHash(roleDNMap));
        var map         = {};
        var rolePermMap = {};
        roles.forEach(function(roleName) {
            var permMap  = pb.PluginService.getPermissionsForRole(roleName);

            rolePermMap[roleName] = {};
            Object.keys(permMap).forEach(function(perm) {
                map[perm] = rolePermMap[roleName][perm] = true;
            });
        });

        var permissions = [];
        var permArray = Object.keys(map);
        for (var i = 0; i < permArray.length; i++) {

            var values = [];
            for (var j = 0; j < roles.length; j++) {

                var value = roles[j] == 'ACCESS_ADMINISTRATOR' || rolePermMap[roles[j]][permArray[i]] !== undefined;
                values.push({val: value});
            }
            permissions.push({name: permArray[i], vals: values});
        }

        var pills = [{
            name: 'permissions',
            title: self.ls.g('generic.PERMISSIONS'),
            icon: 'refresh',
            href: '/admin/users/permissions'
        }, {
            name: 'manage_plugins',
            title: self.ls.g('plugins.MANAGE_PLUGINS'),
            icon: 'puzzle-piece',
            href: '/admin/plugins'
        }];

        pills = pb.AdminSubnavService.addSiteToPills(pills, this.siteName);

        var angularObjects = pb.ClientJs.getAngularObjects({
            navigation: pb.AdminNavigation.get(this.session, ['users', 'permissions'], this.ls, this.site),
            pills: pills,
            roles: roleDNs,
            permissions: permissions
        });

        //render page
        this.setPageName(this.ls.g('generic.PERMISSIONS'));
        self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
        this.ts.load('/admin/users/permissions', function(err, result) {
            cb({content: result});
        });
    };

    //exports
    return PermissionsMapController;
};
