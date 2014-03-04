/**
 * Display's the site's config settings
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function Configuration(){};

//inheritance
util.inherits(Configuration, pb.BaseController);

Configuration.prototype.render = function(cb) {
    var self = this;
	var dao  = new pb.DAO();
	pb.templates.load('admin/site_settings/configuration', '^loc_CONFIGURATION^', null, function(data) {
        var result = data;
        
        result = Configuration.getConfiguration(result);
        
        var pills = require('../site_settings').getPillNavOptions('configuration');
        pills.unshift(
        {
            name: 'configuration',
            title: '^loc_CONFIGURATION^',
            icon: 'refresh',
            href: '/admin/site_settings/configuration'
        });
        
        var objects     = {
            navigation: pb.AdminNavigation.get(self.session, ['settings', 'site_settings']),
            pills: pills
        };
        var angularData = pb.js.getAngularController(objects);
        result          = result.concat(angularData);
        
        var content = self.localizationService.localize(['admin', 'settings', 'site_settings'], result);
        cb({content: content});
    });
};

Configuration.getConfiguration = function(result)
{
    if(!fs.existsSync(DOCUMENT_ROOT + '/config.json'))
    {
        result = result.split('^edit_instructions^').join('<div class="alert alert-info">^loc_EDIT_CONFIGURATION^</div>');
    }
    else
    {
        result = result.split('^edit_instructions^').join('');
    }

    result = result.split('^document_root^').join(pb.config.docRoot);
    result = result.split('^site_ip^').join(pb.config.siteIP);
    result = result.split('^site_port^').join(pb.config.sitePort);
    result = result.split('^db_type^').join(pb.config.db.type);
    result = result.split('^db_name^').join(pb.config.db.name);
    result = result.split('^db_servers^').join(pb.config.db.servers.join('<br/>'));
    
    return result;
};

//exports
module.exports = Configuration;
