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
 * Interface for creating a new object type
 * @class NewObjectType
 * @constructor
 * @extends BaseController
 */
function NewObjectType(){}

//inheritance
util.inherits(NewObjectType, pb.BaseController);

//statics
var SUB_NAV_KEY = 'new_custom_object_type';

NewObjectType.prototype.render = function(cb) {
	var self = this;

    var tabs      = NewObjectType.getTabs(this.ls);
    var coService = new pb.CustomObjectService();
    coService.getReferenceTypes(function(err, objectTypes) {
        if (util.isError(err)) {
            return self.reqHandler.serveError(err);
        }

        var angularData = pb.js.getAngularController(
        {
            navigation: pb.AdminNavigation.get(self.session, ['content', 'custom_objects'], self.ls),
            pills: pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, 'new_object_type'),
            tabs: tabs,
            objectTypes: objectTypes
        });

        self.setPageName(self.ls.get('NEW_OBJECT'));
        self.ts.registerLocal('angular_script', angularData);
        self.ts.load('admin/content/custom_objects/new_object_type', function(err, data) {
            var result = '' + data;
            cb({content: result});
        });
    });
};

NewObjectType.getTabs = function(ls) {
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

NewObjectType.getSubNavItems = function(key, ls, data) {
	var pills = CustomObjects.getPillNavOptions();
	pills.unshift(
    {
        name: 'manage_object_types',
        title: ls.get('NEW_OBJECT_TYPE'),
        icon: 'chevron-left',
        href: '/admin/content/custom_objects/manage_object_types'
    });
	return pills;
};

//register admin sub-nav
pb.AdminSubnavService.registerFor(SUB_NAV_KEY, NewObjectType.getSubNavItems);

//exports
module.exports = NewObjectType;
