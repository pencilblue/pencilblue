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

    var pills   = pb.AdminSubnavService.get(SUB_NAV_KEY, this.ls, 'configuration');
    var objects = {
        navigation: pb.AdminNavigation.get(self.session, ['settings', 'site_settings'], this.ls),
        pills: pills
    };
    var angularData = pb.js.getAngularController(objects);

    this.setPageName(self.ls.get('CONFIGURATION'));
    this.ts.registerLocal('document_root', pb.config.docRoot);
    this.ts.registerLocal('site_ip', pb.config.siteIP);
    this.ts.registerLocal('site_port', pb.config.sitePort);
    this.ts.registerLocal('db_type', pb.config.db.type);
    this.ts.registerLocal('db_name', pb.config.db.name);
    this.ts.registerLocal('db_servers', pb.config.db.servers.join('<br/>'));
    this.ts.registerLocal('edit_instructions', function(flag, cb) {
    	var content ='';
        if(!fs.existsSync(DOCUMENT_ROOT + '/config.json')) {
            content = '<div class="alert alert-info">'+self.ls.get('EDIT_CONFIGURATION')+'</div>';
        }
        cb(null, new pb.TemplateValue(content, false));
    });
    this.ts.registerLocal('angular_script', angularData);
	this.ts.load('admin/site_settings/configuration', function(err, data) {
        cb({content: data});
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
