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
 * Interface for editing an object type
 */

function EditObjectType(){}

//dependencies
var CustomObjects = require('../custom_objects');

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

    var dao = new pb.DAO();
    dao.loadById(vars.id, 'custom_object_type', function(err, objectType) {
	    if(util.isError(err) || objectType === null) {
	        self.redirect('/admin/content/custom_objects/manage_object_types', cb);
            return;
	    }

        var tabs   =
        [
            {
                active: 'active',
                href: '#object_settings',
                icon: 'cog',
                title: self.ls.get('SETTINGS')
            },
            {
                href: '#object_fields',
                icon: 'list-ul',
                title: self.ls.get('FIELDS')
            }
        ];

        var objectTypes = ['article', 'page', 'section', 'topic', 'media', 'user'];

        dao.query('custom_object_type', pb.DAO.ANYWHERE, pb.DAO.PROJECT_ALL).then(function(customObjectTypes) {
            if (util.isError(customObjectTypes)) {
                //TODO handle this
            }

            // Case insensitive test for duplicate name
            for (var i =0; i < customObjectTypes.length; i++) {
                objectTypes.push('custom:' + customObjectTypes[i].name);
            }

            var angularData = pb.js.getAngularController(
            {
                navigation: pb.AdminNavigation.get(self.session, ['content', 'custom_objects'], self.ls),
                pills: pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, 'edit_object_type', objectType),
                tabs: tabs,
                objectTypes: objectTypes,
                objectType: objectType
            });

    	    self.setPageName(objectType.name);
    	    self.ts.registerLocal('object_type_id', objectType._id);
            self.ts.registerLocal('angular_script', angularData);
            self.ts.registerLocal('custom_object_script', pb.js.getJSTag('var customObject = ' + JSON.stringify(objectType)));
    	    self.ts.load('admin/content/custom_objects/edit_object_type',  function(err, data) {
                var result = '' + data;
                cb({content: result});
            });
        });
    });
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
