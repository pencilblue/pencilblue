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
     * Interface for sorting objects
     * @class SortObjects
     * @constructor
     * @extends BaseAdminController
     */
    function SortObjects() {}
    util.inherits(SortObjects, pb.BaseAdminController);

    //statics
    var SUB_NAV_KEY = 'sort_custom_objects';

    SortObjects.prototype.render = function(cb) {
        var self = this;
        var vars = this.pathVars;
        if(!vars.type_id) {
            return this.reqHandler.serve404();
        }

        var service = new pb.CustomObjectService(self.site, true);
        service.loadTypeById(vars.type_id, function(err, objectType) {
            if(util.isError(err)) {
                return self.reqHandler.serveError(err);
            }
            else if (!util.isObject(objectType)) {
                return self.reqHandler.serve404();
            }

            service.findByTypeWithOrdering(objectType, function(err, customObjects) {
                if (util.isError(customObjects)) {
                    return self.reqHandler.serveError(err);
                }

                //none to manage
                if(customObjects.length === 0) {
                    self.redirect('/admin/content/objects/' + vars.type_id + '/new', cb);
                    return;
                }

                var angularObjects = pb.ClientJs.getAngularObjects(
                {
                    navigation: pb.AdminNavigation.get(self.session, ['content', 'custom_objects'], self.ls, self.site),
                    pills: self.getAdminPills(SUB_NAV_KEY, self.ls, SUB_NAV_KEY, {objectType: objectType}),
                    customObjects: customObjects,
                    objectType: objectType,
                });

                self.setPageName(self.ls.get('SORT') + ' ' + objectType.name);
                self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
                self.ts.load('admin/content/objects/sort_objects', function(err, result) {
                    cb({content: result});
                });
            });
        });
    };

    SortObjects.getSubNavItems = function(key, ls, data) {
        return [{
            name: 'manage_objects',
            title: ls.get('SORT') + ' ' + data.objectType.name + ' ' + ls.get('OBJECTS'),
            icon: 'chevron-left',
            href: '/admin/content/objects/' + data.objectType[pb.DAO.getIdField()]
        }, {
            name: 'new_object',
            title: '',
            icon: 'plus',
            href: '/admin/content/objects/' + data.objectType[pb.DAO.getIdField()] + '/new'
        }];
    };

    //register admin sub-nav
    pb.AdminSubnavService.registerFor(SUB_NAV_KEY, SortObjects.getSubNavItems);

    //exports
    return SortObjects;
};
