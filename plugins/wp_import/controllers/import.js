/**
 * WPImportForm - Settings for the display of home page content in the Portfolio theme
 *
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright 2014 PencilBlue, LLC.  All Rights Reserved
 */

function WPImportForm() {}

//dependencies
var PluginService = pb.PluginService;

//inheritance
util.inherits(WPImportForm, pb.BaseController);

WPImportForm.prototype.render = function(cb) {
    var self = this;

    var content = {
        content_type: "text/html",
        code: 200
    };

    self.ts.load('/admin/plugins/settings/wp_import/import', function(err, result) {
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
        result  = result.split('^angular_script^').join(angularData);

        content.content = result;
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
