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

module.exports = function(pb) {
    
    //pb dependencies
    var util = pb.util;
    
    /**
     * Interface for importing topics from CSV
     */
    function ImportTopics(){}
    util.inherits(ImportTopics, pb.BaseController);

    ImportTopics.prototype.init = function (props, cb) {
        var self = this;
        pb.BaseController.prototype.init.call(self, props, function () {
            self.pathSiteUId = pb.SiteService.getCurrentSite(self.pathVars.siteid);
            pb.SiteService.siteExists(self.pathSiteUId, function (err, exists) {
                if (!exists) {
                    self.reqHandler.serve404();
                }
                else {
                    self.sitePrefix = pb.SiteService.getCurrentSitePrefix(self.pathSiteUId);
                    self.queryService = new pb.SiteQueryService(self.pathSiteUId, true);
                    var siteService = new pb.SiteService();
                    siteService.getSiteNameByUid(self.pathSiteUId, function (siteName) {
                        self.siteName = siteName;
                        cb();
                    });
                }
            });
        });
    };

    //statics
    var SUB_NAV_KEY = 'import_topics';

    ImportTopics.prototype.render = function(cb) {
        var self = this;

        var tabs   =
        [
            {
                active: 'active',
                href: '#topic_settings',
                icon: 'file-text-o',
                title: self.ls.get('LOAD_FILE')
            }
        ];

        var pills = pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, 'manage_topics', {sitePrefix: self.sitePrefix});
        var angularObjects = pb.ClientJs.getAngularObjects(
        {
            navigation: pb.AdminNavigation.get(self.session, ['content', 'topics'], self.ls),
            pills: pb.AdminSubnavService.addSiteToPills(pills, self.siteName),
            tabs: tabs,
            sitePrefix: self.sitePrefix
        });

        this.setPageName(this.ls.get('IMPORT_TOPICS'));
        self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
        this.ts.load('admin/content/topics/import_topics', function(err, result) {
            cb({content: result});
        });
    };

    ImportTopics.getSubNavItems = function(key, ls, data) {
        var prefix = data.sitePrefix;
        return [{
            name: 'manage_topics',
            title: ls.get('IMPORT_TOPICS'),
            icon: 'chevron-left',
            href: '/admin' + prefix + '/content/topics'
        }, {
            name: 'import_topics',
            title: '',
            icon: 'upload',
            href: '/admin' + prefix + '/content/topics/import'
        }, {
            name: 'new_topic',
            title: '',
            icon: 'plus',
            href: '/admin' + prefix + '/content/topics/new'
        }];
    };

    //register admin sub-nav
    pb.AdminSubnavService.registerFor(SUB_NAV_KEY, ImportTopics.getSubNavItems);

    //exports
    return ImportTopics;
};
