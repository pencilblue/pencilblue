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
 * Interface for managing object types
 * @class ManageObjectTypes
 * @constructor
 * @extends BaseController
 */
function ManageObjectTypes() {}

//inheritance
util.inherits(ManageObjectTypes, pb.BaseController);

//statics
var SUB_NAV_KEY = 'manage_object_types';

ManageObjectTypes.prototype.render = function(cb) {
    var self = this;

    var service = new pb.CustomObjectService();
    service.findTypes(function(err, custObjTypes) {

        //none to manage
        if(custObjTypes.length === 0) {
            self.redirect('/admin/content/custom_objects/new_object_type', cb);
            return;
        }

        //set listing of field types used by each of the custom object types
        pb.CustomObjectService.setFieldTypesUsed(custObjTypes, self.ls);

        //build out the angular controller
        var angularObjects = pb.js.getAngularObjects(
        {
            navigation: pb.AdminNavigation.get(self.session, ['content', 'custom_objects'], self.ls),
            pills: pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, 'manage_object_types'),
            objectTypes: custObjTypes
        });

        self.setPageName(self.ls.get('MANAGE_OBJECT_TYPES'));
        self.ts.registerLocal('angular_script', '');
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
        href: '/admin/content/objects/types'
    }, {
        name: 'new_object_type',
        title: '',
        icon: 'plus',
        href: '/admin/content/objects/types/new'
    }];
};

//register admin sub-nav
pb.AdminSubnavService.registerFor(SUB_NAV_KEY, ManageObjectTypes.getSubNavItems);

//exports
module.exports = ManageObjectTypes;
