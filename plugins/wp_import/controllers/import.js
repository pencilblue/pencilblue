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

function WPImportForm() {}

//dependencies
var PluginService = pb.PluginService;

//inheritance
util.inherits(WPImportForm, pb.BaseController);

WPImportForm.prototype.render = function(cb) {
    var self = this;

    var tabs = [
        {
            active: 'active',
            href: '#import',
            icon: 'upload',
            title: self.ls.get('UPLOAD_XML')
        }
    ];

    var pills = [
    {
        name: 'content_settings',
        title: self.ls.get('IMPORT_WORDPRESS'),
        icon: 'chevron-left',
        href: '/admin/plugins/settings/wp_import'
    }];

    var objects = {
        navigation: pb.AdminNavigation.get(self.session, ['plugins', 'manage'], self.ls),
        pills: pills,
        tabs: tabs
    };
    var angularData = pb.js.getAngularController(objects);
    this.ts.registerLocal('angular_script', angularData);
    self.ts.load('/admin/plugins/settings/wp_import/import', function(err, result) {

        var content = {
            content: result,
            content_type: "text/html",
            code: 200
        };
        cb(content);
    });
};

WPImportForm.getRoutes = function(cb) {
    var routes = [
        {
            method: 'get',
            path: '/admin/plugins/settings/wp_import/import',
            auth_required: true,
            access_level: ACCESS_MANAGING_EDITOR,
            content_type: 'text/html'
        }
    ];
    cb(null, routes);
};

//exports
module.exports = WPImportForm;
