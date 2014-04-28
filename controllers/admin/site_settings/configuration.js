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

Configuration.prototype.render = function(cb) {
    var self = this;

    this.setPageName(self.ls.get('CONFIGURATION'));
    this.ts.registerLocal('document_root', pb.config.docRoot);
    this.ts.registerLocal('site_ip', pb.config.siteIP);
    this.ts.registerLocal('site_port', pb.config.sitePort);
    this.ts.registerLocal('db_type', pb.config.db.type);
    this.ts.registerLocal('db_servers', pb.config.db.servers.join('<br/>'));
    this.ts.registerLocal('edit_instructions', function(flag, cb) {
    	var content ='';
        if(!fs.existsSync(DOCUMENT_ROOT + '/config.json')) {
            content = '<div class="alert alert-info">'+self.ls.get('EDIT_CONFIGURATION')+'</div>';
        }
        cb(null, content);
    });
	this.ts.load('admin/site_settings/configuration', function(err, data) {
        var result = data;
        
        var pills = SiteSettings.getPillNavOptions('configuration', self.ls);
        pills.unshift(
        {
            name: 'configuration',
            title: self.getPageName(),
            icon: 'refresh',
            href: '/admin/site_settings/configuration'
        });
        
        var objects     = {
            navigation: pb.AdminNavigation.get(self.session, ['settings', 'site_settings'], self.ls),
            pills: pills
        };
        var angularData = pb.js.getAngularController(objects);
        result          = result.split('^angular_script^').join(angularData);

        cb({content: result});
    });
};

//exports
module.exports = Configuration;
