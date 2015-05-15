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
    var util           = pb.util;
    var SectionService = pb.SectionService;
    var SiteService    = pb.SiteService;

    /**
     * Interface for editing the navigation
     */
    function NavigationMap(){}
    util.inherits(NavigationMap, pb.BaseController);

    NavigationMap.prototype.init = function (props, cb) {
        var self = this;
        pb.BaseController.prototype.init.call(self, props, function () {
            self.pathSiteUId = pb.SiteService.getCurrentSite(self.pathVars.siteid);
            pb.SiteService.siteExists(self.pathSiteUId, function (err, exists) {
                if (!exists) {
                    self.reqHandler.serve404();
                }
                else {
                    self.navService = new pb.SectionService(self.pathSiteUId, true);
                    self.sitePrefix = pb.SiteService.getCurrentSitePrefix(self.pathSiteUId);
                    self.queryService = new pb.SiteQueryService(self.pathSiteUId, true);
                    self.settings = pb.SettingServiceFactory.getServiceBySite(self.pathSiteUId, true);
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
    var SUB_NAV_KEY = 'navigation_map';

    NavigationMap.prototype.render = function(cb) {
        var self = this;

        var opts = {
            where: pb.DAO.ANYWHERE
        };
        self.queryService.q('section', opts, function (err, sections) {
            if (util.isError(err)) {
                return self.reqHandler.serveError(err);
            }
            else if(sections.length === 0) {

                //when no sections exist redirect to create page
                return self.redirect('/admin' + self.sitePrefix + '/content/navigation/new', cb);
            }

            self.settings.get('section_map', function (err, sectionMap) {
                if(sectionMap === null) {
                    self.redirect('/admin' + self.sitePrefix + '/content/navigation/new', cb);
                    return;
                }

                var pills = pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, SUB_NAV_KEY, {sitePrefix: self.sitePrefix});
                var angularObjects = pb.ClientJs.getAngularObjects(
                    {
                        navigation: pb.AdminNavigation.get(self.session, ['content', 'sections'], self.ls),
                        pills: pb.AdminSubnavService.addSiteToPills(pills, self.siteName),
                        navItems: NavigationMap.getOrderedItems(sections, sectionMap),
                        icons: {
                            container: 'inbox',
                            section: 'th-large',
                            article: 'files-o',
                            page: 'file-o',
                            link: 'link'
                        },
                        sitePrefix: self.sitePrefix
                    }
                );

                self.setPageName(self.ls.get('NAV_MAP'));
                self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
                self.ts.load('admin/content/navigation/nav_map', function(err, data) {
                    var result = '' + data;
                    cb({content: result});
                });
            });
        });
    };

    NavigationMap.getOrderedItems = function(sections, sectionMap) {
        var orderedSections = [];
        for(var i = 0; i < sectionMap.length; i++) {

            var parentSection = null;
            for(var j = 0; j < sections.length; j++) {
                if(sectionMap[i].uid == sections[j][pb.DAO.getIdField()]) {
                    parentSection          = sections[j];
                    parentSection.children = [];
                    sections.splice(j, 1);
                    break;
                }
            }

            if(!parentSection) {
                continue;
            }

            for(var o = 0; o < sectionMap[i].children.length; o++) {
                for(j = 0; j < sections.length; j++) {
                    if(pb.DAO.areIdsEqual(sections[j][pb.DAO.getIdField()], sectionMap[i].children[o].uid)) {
                        parentSection.children.push(sections[j]);
                        sections.splice(j, 1);
                        break;
                    }
                }
            }

            orderedSections.push(parentSection);
        }

        for(i = 0; i < sections.length; i++) {
            sections[i].children = [];
            orderedSections.push(sections[i]);
        }

        return orderedSections;
    };

    NavigationMap.getSubNavItems = function(key, ls, data) {
        var pills = SectionService.getPillNavOptions(null, data.sitePrefix);
        pills.unshift(
        {
            name: SUB_NAV_KEY,
            title: ls.get('NAV_MAP'),
            icon: 'refresh',
            href: '/admin' + data.sitePrefix + '/content/navigation'
        });
        return pills;
    };

    //register admin sub-nav
    pb.AdminSubnavService.registerFor(SUB_NAV_KEY, NavigationMap.getSubNavItems);

    //exports
    return NavigationMap;
};
