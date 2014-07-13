/**
 * WPManageUsers - Settings for the display of home page content in the Portfolio theme
 *
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright 2014 PencilBlue, LLC.  All Rights Reserved
 */

function WPManageUsers() {}

//dependencies
var PluginService = pb.PluginService;

//inheritance
util.inherits(WPManageUsers, pb.BaseController);

WPManageUsers.prototype.render = function(cb) {
    var self = this;

    var content = {
        content_type: "text/html",
        code: 200
    };

    if(!self.session.importedUsers) {
        cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/plugins/settings/wp_import/import'));
        return;
    }
    else if(!self.session.importedUsers.length) {
        cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/plugins/settings/wp_import/import'));
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
        cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/plugins/settings/wp_import/import'));
        return;
    }

    self.ts.load('/admin/plugins/settings/wp_import/manage_new_users', function(err, result) {
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
            href: '/admin/plugins/settings/wp_import'
        }];

        var objects = {
            navigation: pb.AdminNavigation.get(self.session, ['plugins', 'manage'], self.ls),
            pills: pills,
            tabs: tabs,
            users: self.session.importedUsers,
            adminOptions: pb.users.getAdminOptions(self.session, self.localizationService)
        };
        var angularData = pb.js.getAngularController(objects);
        result  = result.split('^angular_script^').join(angularData);

        content.content = result;
        cb(content);
    });
};

WPManageUsers.getRoutes = function(cb) {
    var routes = [
        {
            method: 'get',
            path: '/admin/plugins/settings/wp_import/manage_new_users',
            auth_required: true,
            access_level: ACCESS_MANAGING_EDITOR,
            content_type: 'text/html'
        }
    ];
    cb(null, routes);
};

//exports
module.exports = WPManageUsers;
