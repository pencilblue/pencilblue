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

/**
 * Interface for displaying the site's configuration settings
 */

function Configuration(){}

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

        var angularData = pb.js.getAngularController(
            {
                navigation: pb.AdminNavigation.get(self.session, ['settings', 'site_settings'], self.ls),
                pills: pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, 'configuration'),
                callHome: callHome
            }
        );

        self.setPageName(self.ls.get('CONFIGURATION'));
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
