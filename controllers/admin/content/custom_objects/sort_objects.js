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
 * Interface for sorting objects
 * @class SortObjects
 * @constructor
 * @extends BaseController
 */
function SortObjects() {}

//inheritance
util.inherits(SortObjects, pb.BaseController);

//statics
var SUB_NAV_KEY = 'sort_custom_objects';

SortObjects.prototype.render = function(cb) {
	var self = this;
	var vars = this.pathVars;
    if(!vars.type_id) {
        return this.reqHandler.serve404();
    }

    var service = new pb.CustomObjectService();
    service.loadTypeById(vars.type_id, function(err, objectType) {
		if(util.isError(err) || objectType === null) {
            return self.reqHandler.serveError(err);
        }
        else if (!pb.utils.isObject(objectType)) {
            return self.reqHandler.serve404();
        }

        service.findByTypeWithOrdering(objectType, function(err, customObjects) {
		    if (util.isError(customObjects)) {
			    return self.reqHandler.serveError(err);
		    }

		    //none to manage
            if(customObjects.length === 0) {
                self.redirect('/admin/content/custom_objects/new_object/' + vars.type_id, cb);
                return;
            }

            var angularData = pb.js.getAngularController(
            {
                navigation: pb.AdminNavigation.get(self.session, ['content', 'custom_objects'], self.ls),
                pills: pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, null, objectType),
                customObjects: customObjects,
                objectType: objectType
            });

            self.setPageName(self.ls.get('MANAGE') + ' ' + objectType.name);
            self.ts.registerLocal('object_type_id', objectType._id);
            self.ts.registerLocal('angular_script', angularData);
            self.ts.load('admin/content/custom_objects/sort_objects', function(err, data) {
                var result = '' + data;
                cb({content: result});
            });
        });
    });
};

SortObjects.getSubNavItems = function(key, ls, data) {
	return [
        {
            name: 'manage_objects',
            title: ls.get('SORT') + ' ' + data.name + ' ' + ls.get('OBJECTS'),
            icon: 'chevron-left',
            href: '/admin/content/custom_objects/manage_objects/' + data._id
        },
        {
            name: 'new_object',
            title: '',
            icon: 'plus',
            href: '/admin/content/custom_objects/new_object/' + data._id
        }
    ];
};

//register admin sub-nav
pb.AdminSubnavService.registerFor(SUB_NAV_KEY, SortObjects.getSubNavItems);

//exports
module.exports = SortObjects;
