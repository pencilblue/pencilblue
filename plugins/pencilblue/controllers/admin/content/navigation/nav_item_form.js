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
var async = require('async');

module.exports = function(pb) {

    //pb dependencies
    var util = pb.util;
    var SectionService = pb.SectionService;
    /**
     * Interface for creating and editing navigation items
     * @class NavItemFormController
     */
    function NavItemFormController(){
        this.navItem = null;
    }
    util.inherits(NavItemFormController, pb.BaseAdminController);

    //statics
    var SUB_NAV_KEY = 'nav_item_form';

    NavItemFormController.prototype.render = function(cb) {
        var self = this;
        var vars = this.pathVars;

        //gather all data
        this.gatherData(vars, function(err, data) {
            if (util.isError(err)) {
                throw err;
            }
            else if(!data.navItem) {
                self.reqHandler.serve404();
                return;
            }

            self.navItem = data.navItem;
            var contentSearchValue = self.navItem.contentSearchValue ? self.navItem.contentSearchValue.toString() : '';
            delete self.navItem.contentSearchValue;

            var navData = {
                item: self.navItem,
            };
            data.pills = self.getAdminPills(self.getSubnavKey(), self.ls, self.getSubnavKey(), navData);
            var angularObjects = pb.ClientJs.getAngularObjects(data);

            self.setPageName(self.navItem[pb.DAO.getIdField()] ? self.navItem.name : self.ls.get('NEW_NAV_ITEM'));
            self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
            self.ts.registerLocal('content_type', '{{section.type}}');
            self.ts.registerLocal('selection_id_field', 'item');
            self.ts.registerLocal('content_search_value', contentSearchValue ? contentSearchValue : '');
            self.ts.load('admin/content/navigation/nav_item_form', function(err, result) {
                cb({content: result});
            });
        });
    };

    NavItemFormController.prototype.gatherData = function(vars, cb) {
        var self = this;
        var userService = new pb.UserService(self.getServiceContext());
        var tasks = {

            //get editors
            editors: function(callback) {
                userService.getWriterOrEditorSelectList(self.session.authentication.user_id, false, callback);
            },

            //get parents
            parents: function(callback) {
                var sectionService = new SectionService({site: self.site, onlyThisSite: true});
                sectionService.getParentSelectList(self.pathVars.id, function(err, parents) {
                    if(util.isError(err)) {
                        callback(err, parents);
                        return;
                    }

                    parents.unshift({_id: '', name: ''});
                    callback(null, parents);
                });
            },

            //form tabs
            tabs: function(callback) {
                var tabs = [
                    {
                        active: 'active',
                        href: '#section_settings',
                        icon: 'cog',
                        title: self.ls.get('SETTINGS')
                    }
                ];
                callback(null, tabs);
            },

            navigation: function(callback) {
                callback(null, pb.AdminNavigation.get(self.session, ['content', 'sections'], self.ls, self.site));
            },

            types: function(callback) {
                callback(null, SectionService.getTypes(self.ls));
            },

            navItem: function(callback) {
                if(!vars.id) {
                    var navItem = {
                        type: 'container'
                    };
                    callback(null, navItem);
                    return;
                }

                self.siteQueryService.loadById(vars.id, 'section', function(err, navItem) {
                    if(!navItem || !navItem.item) {
                        callback(err, navItem);
                        return;
                    }

                    //TODO modify such that only the needed field of "headline" is returned.
                    self.siteQueryService.loadById(navItem.item, navItem.type, function(err, articleOrPage) {
                        if(articleOrPage) {
                            navItem.contentSearchValue = articleOrPage.headline;
                        }

                        callback(err, navItem);
                    });
                });
            }
        };
        async.series(tasks, cb);
    };

    NavItemFormController.prototype.getSubnavKey = function() {
        return SUB_NAV_KEY;
    };

    NavItemFormController.getSubNavItems = function(key, ls, data) {
        var item = data.item;
        var pills = SectionService.getPillNavOptions(null);
        pills.unshift(
        {
            name: 'manage_nav_items',
            title: item[pb.DAO.getIdField()] ? ls.get('EDIT') + ' ' + item.name : ls.get('NEW_NAV_ITEM'),
            icon: 'chevron-left',
            href: '/admin/content/navigation'
        });
        return pills;
    };

    //register admin sub-nav
    pb.AdminSubnavService.registerFor(SUB_NAV_KEY, NavItemFormController.getSubNavItems);

    //exports
    return NavItemFormController;
};
