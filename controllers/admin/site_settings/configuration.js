/**
 * Display's the site's config settings
 *
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function Configuration(){};

//dependencies
var SiteSettings = require('../site_settings');

//inheritance
util.inherits(Configuration, pb.BaseController);

//statics
var SUB_NAV_KEY = 'site_configuration';

Configuration.prototype.render = function(cb) {
    var self = this;

    pb.settings.get('call_home', function(err, callHome) {
        if (util.isError(err)) {
            self.reqHandler.serveError(err);
            return;
        }

        var pills   = pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, 'configuration');
        var objects = {
            navigation: pb.AdminNavigation.get(self.session, ['settings', 'site_settings'], self.ls),
            pills: pills
        };
        var angularData = pb.js.getAngularController(objects);

        self.setPageName(self.ls.get('CONFIGURATION'));
        self.ts.registerLocal('yes_checked', callHome ? 'checked' : '');
        self.ts.registerLocal('no_checked', callHome ? '' : 'checked');
        self.ts.registerLocal('document_root', pb.config.docRoot);
        self.ts.registerLocal('site_ip', pb.config.siteIP);
        self.ts.registerLocal('site_port', pb.config.sitePort);
        self.ts.registerLocal('db_type', pb.config.db.type);
        self.ts.registerLocal('db_name', pb.config.db.name);
        self.ts.registerLocal('db_servers', pb.config.db.servers.join('<br/>'));
        self.ts.registerLocal('edit_instructions', function(flag, cb) {
            var content ='';
            if(!fs.existsSync(DOCUMENT_ROOT + '/config.json')) {
                content = '<div class="alert alert-info">'+self.ls.get('EDIT_CONFIGURATION')+'</div>';
            }
            cb(null, new pb.TemplateValue(content, false));
        });
        self.ts.registerLocal('angular_script', angularData);
        self.ts.load('admin/site_settings/configuration', function(err, data) {
            cb({content: data});
        });
    });
};

Configuration.getSubNavItems = function(key, ls, data) {
	var pills = SiteSettings.getPillNavOptions(ls);
    pills.unshift(
    {
        name: 'configuration',
        title: ls.get('CONFIGURATION'),
        icon: 'refresh',
        href: '/admin/site_settings/configuration'
    });
    return pills;
};

//register admin sub-nav
pb.AdminSubnavService.registerFor(SUB_NAV_KEY, Configuration.getSubNavItems);

//exports
module.exports = Configuration;
