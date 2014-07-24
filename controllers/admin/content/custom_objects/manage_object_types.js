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
 */

function ManageObjectTypes() {}

//dependencies
var CustomObjects = require('../custom_objects');

//inheritance
util.inherits(ManageObjectTypes, pb.BaseController);

//statics
var SUB_NAV_KEY = 'manage_custom_object_types';

ManageObjectTypes.prototype.render = function(cb) {
	var self = this;
	var dao  = new pb.DAO();
	dao.query('custom_object_type', pb.DAO.ANYWHERE, pb.DAO.PROJECT_ALL).then(function(customObjectTypes) {
		if (util.isError(customObjectTypes)) {
			//TODO handle this
		}

		//none to manage
        if(customObjectTypes.length === 0) {
            self.redirect('/admin/content/custom_objects/new_object_type', cb);
            return;
        }

        customObjectTypes = ManageObjectTypes.setFieldTypesUsed(self, customObjectTypes);

        //currently, mongo cannot do case-insensitive sorts.  We do it manually
        //until a solution for https://jira.mongodb.org/browse/SERVER-90 is merged.
        customObjectTypes.sort(function(a, b) {
            var x = a.name.toLowerCase();
            var y = b.name.toLowerCase();

            return ((x < y) ? -1 : ((x > y) ? 1 : 0));
        });

        var angularData = pb.js.getAngularController(
        {
            navigation: pb.AdminNavigation.get(self.session, ['content', 'custom_objects'], self.ls),
            pills: pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, 'manage_object_types'),
            customObjectTypes: customObjectTypes
        }, [], 'initObjectTypesPagination()');

        self.setPageName(self.ls.get('MANAGE_OBJECT_TYPES'));
        self.ts.registerLocal('angular_script', angularData);
        self.ts.load('admin/content/custom_objects/manage_object_types', function(err, data) {
            var result = '' + data;
            cb({content: result});
        });
    });
};

ManageObjectTypes.setFieldTypesUsed = function(self, customObjectTypes) {
    // Make the list of field types used in each custom object type, for display
    for(var i = 0; i < customObjectTypes.length; i++) {
        var fieldTypesUsed = [];
        for(var key in customObjectTypes[i].fields) {
            var fieldType = customObjectTypes[i].fields[key].field_type;
            switch(fieldType) {
                case 'text':
                    fieldTypesUsed.push(self.ls.get('TEXT'));
                    break;
                case 'number':
                    fieldTypesUsed.push(self.ls.get('NUMBER'));
                    break;
                case 'date':
                    fieldTypesUsed.push(self.ls.get('DATE'));
                    break;
                case 'peer_object':
                    fieldTypesUsed.push(self.ls.get('PEER_OBJECT'));
                    break;
                case 'child_objects':
                    fieldTypesUsed.push(self.ls.get('CHILD_OBJECTS'));
                    break;
                default:
                    break;
            }
        }

        for(var j = 0; j < fieldTypesUsed.length; j++) {
            for(var s = j + 1; s < fieldTypesUsed.length; s++) {
                if(fieldTypesUsed[s] == fieldTypesUsed[j]) {
                    fieldTypesUsed.splice(s, 1);
                    s--;
                }
            }
        }

        customObjectTypes[i].fieldTypesUsed = fieldTypesUsed.join(', ');
    }

    return customObjectTypes;
};

ManageObjectTypes.getSubNavItems = function(key, ls, data) {
	var pills = CustomObjects.getPillNavOptions('manage_object_types');
	pills.unshift(
    {
        name: 'manage_object_types',
        title: ls.get('MANAGE_OBJECT_TYPES'),
        icon: 'refresh',
        href: '/admin/content/custom_objects/manage_object_types'
    });
	return pills;
};

//register admin sub-nav
pb.AdminSubnavService.registerFor(SUB_NAV_KEY, ManageObjectTypes.getSubNavItems);

//exports
module.exports = ManageObjectTypes;
