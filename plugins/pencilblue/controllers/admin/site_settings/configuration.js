/*
    Copyright (C) 2015  PencilBlue, LLC

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

//dependencies
var fs = require('fs');

module.exports = function(pb) {
    
    //pb dependencies
    var util = pb.util;
    
    /**
     * Interface for displaying the site's configuration settings
     */
    function Configuration(){}
    util.inherits(Configuration, pb.BaseController);

    //statics
    var SUB_NAV_KEY = 'site_configuration';

    Configuration.prototype.init = function (props, cb) {
        var self = this;
        pb.BaseController.prototype.init.call(self, props, function () {
            self.pathSiteUId = pb.SiteService.getCurrentSite(self.pathVars.siteid);
            var siteService = new pb.SiteService();
            siteService.getByUid(self.pathSiteUId, function(err, site) {
                if (!site) {
                    self.reqHandler.serve404();
                }
                else {
                    self.sitePrefix = pb.SiteService.getCurrentSitePrefix(self.pathSiteUId);
                    self.siteObj = site;
                    self.isGlobalSite = site.uid === pb.SiteService.GLOBAL_SITE;
                    self.siteName = self.isGlobalSite ? site.uid : site.displayName;
                    cb();
                }
            });
        });
    };

    Configuration.prototype.render = function(cb) {
        var self = this;

        pb.settings.get('call_home', function(err, callHome) {
            if(util.isError(err)) {
                self.reqHandler.serveError(err);
                return;
            }

            var config = {
                siteName: self.siteObj.displayName,
                siteRoot: self.siteObj.hostname,
                documentRoot: pb.config.docRoot,
                siteIP: pb.config.siteIP,
                sitePort: pb.config.sitePort,
                dbType: pb.config.db.type,
                dbName: pb.config.db.name,
                dbServers: pb.config.db.servers,
                callHome: callHome || true,
                configSet: fs.existsSync(pb.config.docRoot + '/config.json')
            };

            var angularObjects = pb.ClientJs.getAngularObjects({
                navigation: pb.AdminNavigation.get(self.session, ['settings', 'site_settings'], self.ls),
                pills: pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, 'configuration', {sitePrefix: self.sitePrefix, site: self.pathSiteUId, siteName: self.siteName}),
                config: config,
                isGlobalSite: self.isGlobalSite
            });

            self.setPageName(self.ls.get('CONFIGURATION'));
            self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
            self.ts.load('admin/site_settings/configuration', function(err, result) {
                cb({content: result});
            });
        });
    };

    Configuration.getSubNavItems = function(key, ls, data) {
        var prefix = '/admin';
        if(data && data.sitePrefix) {
            prefix += data.sitePrefix;
        }

        var pills = [{
            name: 'configuration',
            title: ls.get('CONFIGURATION'),
            icon: 'refresh',
            href: prefix + '/site_settings'
        }, {
            name: 'content',
            title: ls.get('CONTENT'),
            icon: 'quote-right',
            href: prefix + '/site_settings/content'
        }, {
            name: 'email',
            title: ls.get('EMAIL'),
            icon: 'envelope',
            href: prefix + '/site_settings/email'
        }];

        if(data && data.site === pb.SiteService.GLOBAL_SITE) {
            pills.push({
                name: 'libraries',
                title: ls.get('LIBRARIES'),
                icon: 'book',
                href: prefix + '/site_settings/libraries'
            });
        }

        if(data && data.siteName) {
            return pb.AdminSubnavService.addSiteToPills(pills, data.siteName);
        }
        
        return pills;
    };

    //register admin sub-nav
    pb.AdminSubnavService.registerFor(SUB_NAV_KEY, Configuration.getSubNavItems);

    //exports
    return Configuration;
};
