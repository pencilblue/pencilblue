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

module.exports = function (pb) {

    //pb dependencies
    var util = pb.util;

    /**
     * @class WPImportViewController
     * @extends BaseController
     * @constructor
     */
    function WPImportViewController() {}
    util.inherits(WPImportViewController, pb.BaseController);

    /**
     * @method render
     * @param {function} cb (Error|object)
     */
    WPImportViewController.prototype.render = function(cb) {
        var self = this;

        var objects = {
            navigation: pb.AdminNavigation.get(self.session, ['plugins', 'manage'], self.ls, self.site),
            pills: [
                {
                    name: 'content_settings',
                    title: self.ls.g('IMPORT_WORDPRESS'),
                    icon: 'chevron-left',
                    href: '/admin/plugins/wp_import/settings'
                }
            ],
            tabs: [
                {
                    active: 'active',
                    href: '#import',
                    icon: 'upload',
                    title: self.ls.g('UPLOAD_XML')
                }
            ]
        };
        var angularObjects = pb.ClientJs.getAngularObjects(objects);

        this.setPageName(this.ls.g('IMPORT_WORDPRESS'));
        self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
        self.ts.load('/admin/plugins/settings/wp_import/import', function(err, result) {
            cb({
                content: result
            });
        });
    };

    /**
     * @static
     * @method getRoutes
     * @param {function} cb (Error, Array)
     */
    WPImportViewController.getRoutes = function(cb) {
        var routes = [
            {
                method: 'get',
                path: '/admin/plugins/wp_import/settings/import',
                auth_required: true,
                inactive_site_access: true,
                access_level: pb.SecurityService.ACCESS_MANAGING_EDITOR,
                content_type: 'text/html'
            }
        ];
        cb(null, routes);
    };

    //exports
    return WPImportViewController;
};
