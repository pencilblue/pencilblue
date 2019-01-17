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
    var util = pb.util;

    /**
     * Interface for managing objects
     * @class ManageObjects
     * @constructor
     * @extends BaseAdminController
     */
    function ManageObjects() {}
    util.inherits(ManageObjects, pb.BaseAdminController);

    //statics
    var SUB_NAV_KEY = 'manage_custom_objects';

    ManageObjects.prototype.render = function(cb) {
        var self = this;
        var vars = this.pathVars;

        if(!pb.validation.isIdStr(vars.type_id, true)) {
            return this.reqHandler.serve404();
        }

        var service = new pb.CustomObjectService(self.site, false);
        service.loadTypeById(vars.type_id, function(err, custObjType) {
            if (util.isError(err)) {
                return self.serveError(err);
            }
            else if (!util.isObject(custObjType)) {
                return self.reqHandler.serve404();
            }

            service.findByTypeWithOrdering(custObjType, function(err, customObjects) {
                if (util.isError(customObjects)) {
                    return self.reqHandler.serveError(err);
                }

                //none to manage
                if(customObjects.length === 0) {
                    return self.redirect(pb.UrlService.urlJoin('/admin/content/objects/', encodeURIComponent(vars.type_id), '/new'), cb);
                }


                var data = {};
                data.custObjType = custObjType;
                var pills = pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, 'manage_objects', data);
                for(var i = 0; i < pills.length; i++) {
                    if(pills[i].name === 'manage_objects') {
                        pills[i].title += ' (' + customObjects.length + ')';
                        break;
                    }
                }
                pills = pb.AdminSubnavService.addSiteToPills(pills, self.siteName);

                var angularObjects = pb.ClientJs.getAngularObjects(
                {
                    navigation: pb.AdminNavigation.get(self.session, ['content', 'custom_objects'], self.ls, self.site),
                    pills: pills,
                    customObjects: customObjects,
                    objectType: custObjType
                });

                var title = self.ls.g('generic.MANAGE') + ' ' + custObjType.name;
                self.setPageName(title);
                self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
                self.ts.load('admin/content/objects/manage_objects', function(err, result) {
                    cb({content: result});
                });
            });
        });
    };

    ManageObjects.getSubNavItems = function(key, ls, data) {
        return [{
            name: 'manage_objects',
            title: ls.g('generic.MANAGE') + ' ' + data.custObjType.name + ' ' + ls.g('custom_objects.OBJECTS'),
            icon: 'chevron-left',
            href: '/admin/content/objects/types'
        }, {
            name: 'sort_objects',
            title: '',
            icon: 'sort-amount-desc',
            href: '/admin/content/objects/' + data.custObjType[pb.DAO.getIdField()] + '/sort'
        }, {
            name: 'new_object',
            title: '',
            icon: 'plus',
            href: '/admin/content/objects/' + data.custObjType[pb.DAO.getIdField()] + '/new'
        }];
    };

    //register admin sub-nav
    pb.AdminSubnavService.registerFor(SUB_NAV_KEY, ManageObjects.getSubNavItems);

    //exports
    return ManageObjects;
};
