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

//dependencies
var fs = require('fs');

module.exports = function(pb) {

    //pb dependencies
    var util = pb.util;

    /**
     * Interface for displaying the site's configuration settings
     */
    function Configuration(){}
    util.inherits(Configuration, pb.BaseAdminController);

    //statics
    var SUB_NAV_KEY = 'site_configuration';

    Configuration.prototype.render = function(cb) {
        var self = this;

        pb.settings.get('call_home', function(err, callHome) {
            if(util.isError(err)) {
                self.reqHandler.serveError(err);
                return;
            }

            if(typeof callHome === 'undefined') {
              callHome = true;
            }

            var config = {
                siteName: self.siteObj.displayName,
                siteRoot: self.siteObj.hostname,
                mediaRoot: pb.config.media.urlRoot ? pb.config.media.urlRoot : self.siteObj.hostname,
                documentRoot: pb.config.docRoot,
                siteIP: pb.config.siteIP,
                sitePort: pb.config.sitePort,
                dbType: pb.config.db.type,
                dbName: pb.config.db.name,
                dbServers: pb.config.db.servers,
                callHome: callHome,
                configSet: fs.existsSync(pb.config.docRoot + '/config.json')
            };

            var angularObjects = pb.ClientJs.getAngularObjects({
                navigation: pb.AdminNavigation.get(self.session, ['settings', 'site_settings'], self.ls, self.site),
                pills: self.getAdminPills(SUB_NAV_KEY, self.ls, 'configuration', {site: self.site}),
                config: config,
                isGlobalSite: pb.SiteService.isGlobal(self.site)
            });

            self.setPageName(self.ls.g('site_settings.CONFIGURATION'));
            self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
            self.ts.load('admin/site_settings/configuration', function(err, result) {
                cb({content: result});
            });
        });
    };

    Configuration.getSubNavItems = function(key, ls, data) {
        var pills = [{
            name: 'configuration',
            title: ls.g('site_settings.CONFIGURATION'),
            icon: 'refresh',
            href: '/admin/site_settings'
        }, {
            name: 'content',
            title: ls.g('generic.CONTENT'),
            icon: 'quote-right',
            href: '/admin/site_settings/content'
        }, {
            name: 'email',
            title: ls.g('generic.EMAIL'),
            icon: 'envelope',
            href: '/admin/site_settings/email'
        }];

        if(data && data.site === pb.SiteService.GLOBAL_SITE) {
            pills.push({
                name: 'libraries',
                title: ls.g('site_settings.LIBRARIES'),
                icon: 'book',
                href: '/admin/site_settings/libraries'
            });
        }

        return pills;
    };

    //register admin sub-nav
    pb.AdminSubnavService.registerFor(SUB_NAV_KEY, Configuration.getSubNavItems);

    //exports
    return Configuration;
};
