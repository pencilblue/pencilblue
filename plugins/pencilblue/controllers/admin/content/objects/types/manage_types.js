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
     * Interface for managing object types
     * @class ManageObjectTypes
     * @constructor
     * @extends BaseController
     */
    function ManageObjectTypes() {}
    util.inherits(ManageObjectTypes, pb.BaseController);

    //statics
    var SUB_NAV_KEY = 'manage_object_types';

    ManageObjectTypes.prototype.init = function (props, cb) {
        var self = this;

        pb.BaseController.prototype.init.call(self, props, function() {
            self.pathSiteUid = pb.SiteService.getCurrentSite(self.pathVars.siteid);
            pb.SiteService.siteExists(self.pathSiteUid, function (err, exists) {
                if (!exists) {
                    self.reqHandler.serve404();
                }
                else {
                    self.pathSitePrefix = pb.SiteService.getCurrentSitePrefix(self.pathSiteUid);
                    var siteService = new pb.SiteService();
                    siteService.getSiteNameByUid(self.pathSiteUid, function (siteName) {
                        self.siteName = siteName;
                        cb();
                    });
                }
            });
        });
    };

    ManageObjectTypes.prototype.render = function(cb) {
        var self = this;

        var service = new pb.CustomObjectService(self.pathSiteUid, true);
        service.findTypes(function(err, custObjTypes) {

            //none to manage
            if(custObjTypes.length === 0) {
                self.redirect('/admin' + self.pathSitePrefix + '/content/objects/types/new', cb);
                return;
            }

            //set listing of field types used by each of the custom object types
            pb.CustomObjectService.setFieldTypesUsed(custObjTypes, self.ls);

            //build out the angular controller
            var data = {};
            data.pathSitePrefix = self.pathSitePrefix;
            var pills = pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, SUB_NAV_KEY, data);
            pills = pb.AdminSubnavService.addSiteToPills(pills, self.siteName);
            var angularObjects = pb.ClientJs.getAngularObjects(
            {
                navigation: pb.AdminNavigation.get(self.session, ['content', 'custom_objects'], self.ls),
                pills: pills,
                objectTypes: custObjTypes,
                pathSitePrefix: self.pathSitePrefix
            });

            self.setPageName(self.ls.get('MANAGE_OBJECT_TYPES'));
            self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
            self.ts.load('admin/content/objects/types/manage_types', function(err, data) {
                var result = '' + data;
                cb({content: result});
            });
        });
    };


    ManageObjectTypes.getSubNavItems = function(key, ls, data) {
        return [{
            name: SUB_NAV_KEY,
            title: ls.get('MANAGE_OBJECT_TYPES'),
            icon: 'refresh',
            href: '/admin' + data.pathSitePrefix + '/content/objects/types'
        }, {
            name: 'new_object_type',
            title: '',
            icon: 'plus',
            href: '/admin' + data.pathSitePrefix + '/content/objects/types/new'
        }];
    };

    //register admin sub-nav
    pb.AdminSubnavService.registerFor(SUB_NAV_KEY, ManageObjectTypes.getSubNavItems);

    //exports
    return ManageObjectTypes;
};
