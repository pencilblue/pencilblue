/**
 * ContentSettings - Settings for the display of content in the Portfolio theme
 *
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright 2014 PencilBlue, LLC.  All Rights Reserved
 */

function ContentSettings() {}

//dependencies
var PluginService = pb.PluginService;
var Media = require(DOCUMENT_ROOT + '/controllers/admin/content/media.js');

//inheritance
util.inherits(ContentSettings, pb.BaseController);

ContentSettings.prototype.render = function(cb) {
    var self = this;

    var content = {
        content_type: "text/html",
        code: 200
    };

    self.ts.load('admin/plugins/portfolio/content_settings', function(err, result) {
        var tabs = [
            {
                active: 'active',
                href: '#home_layout',
                icon: 'home',
                title: self.ls.get('HOME_LAYOUT')
            },
            {
                href: '#media',
                icon: 'picture-o',
                title: self.ls.get('HOME_MEDIA')
            },
            {
                href: '#hero_images',
                icon: 'picture-o',
                title: self.ls.get('HERO_IMAGES')
            }
        ];

        var pills = [
        {
            name: 'content_settings',
            title: self.ls.get('CONTENT_SETTINGS'),
            icon: 'chevron-left',
            href: '/admin/plugins/portfolio/settings'
        }];

        var dao  = new pb.DAO();
        dao.query('page', pb.DAO.ANYWHERE, pb.DAO.PROJECT_ALL, {headline: pb.DAO.ASC}).then(function(pages) {
            Media.getAll(function(media) {
                var objects = {
                    navigation: pb.AdminNavigation.get(self.session, ['plugins', 'manage'], self.ls),
                    pills: pills,
                    tabs: tabs,
                    media: media,
                    pages: pages
                };
                var angularData = pb.js.getAngularController(objects);
                result  = result.split('^angular_script^').join(angularData);

                content.content = result;
                cb(content);
            });
        });
    });
};

ContentSettings.getRoutes = function(cb) {
    var routes = [
        {
            method: 'get',
            path: '/admin/plugins/portfolio/content_settings',
            auth_required: true,
            access_level: ACCESS_EDITOR,
            content_type: 'text/html'
        }
    ];
    cb(null, routes);
};

//exports
module.exports = ContentSettings;
