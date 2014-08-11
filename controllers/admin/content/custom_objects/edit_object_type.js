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

//dependencies
var CustomObjects = require('../custom_objects');

/**
 * Interface for editing an object type
 * @class EditObjectType
 * @constructor
 * @extends BaseController
 */
function EditObjectType(){}

//inheritance
util.inherits(EditObjectType, pb.BaseController);

//statics
var SUB_NAV_KEY = 'edit_custom_object_type';

EditObjectType.prototype.render = function(cb) {
	var self = this;
	var vars = this.pathVars;

    if(!vars.id) {
        self.redirect('/admin/content/custom_objects/manage_object_types', cb);
        return;
    }

    var service = new pb.CustomObjectService();
    service.loadTypeById(vars.id, function(err, objectType) {
	    if(util.isError(err)) {
	        return self.reqHandler.serveError(err);
	    }
        else if (!pb.utils.isObject(objectType)) {
            return self.reqHandler.serve404();
        }

        service.getReferenceTypes(function(err, objectTypes) {
            if(util.isError(err)) {
                return self.reqHandler.serveError(err);
            }

            var angularData = pb.js.getAngularController(
            {
                navigation: pb.AdminNavigation.get(self.session, ['content', 'custom_objects'], self.ls),
                pills: pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, 'edit_object_type', objectType),
                tabs: EditObjectType.getTabs(self.ls),
                objectTypes: objectTypes,
                objectType: objectType
            });

    	    self.setPageName(objectType.name);
    	    self.ts.registerLocal('object_type_id', objectType[pb.DAO.getIdField()]);
            self.ts.registerLocal('angular_script', angularData);
            self.ts.registerLocal('custom_object_script', pb.js.getJSTag('var customObject = ' + JSON.stringify(objectType)));
    	    self.ts.load('admin/content/custom_objects/edit_object_type',  function(err, data) {
                var result = '' + data;
                cb({content: result});
            });
        });
    });
};

EditObjectType.getTabs = function(ls) {
    return [
        {
            active: 'active',
            href: '#object_settings',
            icon: 'cog',
            title: ls.get('SETTINGS')
        },
        {
            href: '#object_fields',
            icon: 'list-ul',
            title: ls.get('FIELDS')
        }
    ];
};

EditObjectType.getSubNavItems = function(key, ls, data) {
	var pills = CustomObjects.getPillNavOptions();
    pills.unshift(
    {
        name: 'manage_object_types',
        title: data.name,
        icon: 'chevron-left',
        href: '/admin/content/custom_objects/manage_object_types'
    });
    return pills;
};

//register admin sub-nav
pb.AdminSubnavService.registerFor(SUB_NAV_KEY, EditObjectType.getSubNavItems);

//exports
module.exports = EditObjectType;
