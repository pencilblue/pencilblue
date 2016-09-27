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

module.exports = function(pb) {

    //pb dependencies
    var util           = pb.util;
    var SectionService = pb.SectionService;

    /**
     * Interface for editing the navigation
     */
    function NavigationMap(){}
    util.inherits(NavigationMap, pb.BaseAdminController);

    //statics
    var SUB_NAV_KEY = 'navigation_map';

    NavigationMap.prototype.render = function(cb) {
        var self = this;

        var opts = {
            where: pb.DAO.ANYWHERE
        };
        self.siteQueryService.q('section', opts, function (err, sections) {
            if (util.isError(err)) {
                return self.reqHandler.serveError(err);
            }
            else if(sections.length === 0) {

                //when no sections exist redirect to create page
                return self.redirect('/admin/content/navigation/new', cb);
            }

            self.settings.get('section_map', function (err, sectionMap) {
                if(sectionMap === null) {
                    self.redirect('/admin/content/navigation/new', cb);
                    return;
                }

                var angularObjects = pb.ClientJs.getAngularObjects(
                    {
                        navigation: pb.AdminNavigation.get(self.session, ['content', 'sections'], self.ls, self.site),
                        pills: self.getAdminPills(SUB_NAV_KEY, self.ls, SUB_NAV_KEY),
                        navItems: NavigationMap.getOrderedItems(sections, sectionMap),
                        icons: {
                            container: 'inbox',
                            section: 'th-large',
                            article: 'files-o',
                            page: 'file-o',
                            link: 'link'
                        }
                    }
                );

                self.setPageName(self.ls.g('generic.NAV_MAP'));
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
         var formatSection = function(parentSection){
          var result = null;
          for(var i = 0; i < sections.length; i++){

            if(pb.DAO.areIdsEqual(parentSection.uid,sections[i][pb.DAO.getIdField()])){
              result = sections[i];
              result.children = []
              sections.splice(i, 1);

            if (parentSection.children) {
              for(var j = 0; j < parentSection.children.length; j++){
                 result.children.push(formatSection(parentSection.children[j]));
              }  
            }

              break;
            }
          }
          return result;
        }
        for(var i = 0; i < sectionMap.length; i++) {
            orderedSections.push(formatSection(sectionMap[i]));
        }

        for(i = 0; i < sections.length; i++) {
            sections[i].children = [];
            orderedSections.push(sections[i]);
        }

        return orderedSections;
    };

    NavigationMap.getSubNavItems = function(key, ls, data) {
        var pills = SectionService.getPillNavOptions();
        pills.unshift(
        {
            name: SUB_NAV_KEY,
            title: ls.g('generic.NAV_MAP'),
            icon: 'refresh',
            href: '/admin/content/navigation'
        });
        return pills;
    };

    //register admin sub-nav
    pb.AdminSubnavService.registerFor(SUB_NAV_KEY, NavigationMap.getSubNavItems);

    //exports
    return NavigationMap;
};
