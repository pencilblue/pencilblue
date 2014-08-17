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
 * Interface for managing objects
 * @class ManageObjects
 * @constructor
 * @extends BaseController
 */
function ManageObjects() {}

//inheritance
util.inherits(ManageObjects, pb.BaseController);

//statics
var SUB_NAV_KEY = 'manage_custom_objects';

ManageObjects.prototype.render = function(cb) {
	var self = this;
	var vars = this.pathVars;

    if(!vars.id) {
        return this.reqHandler.serve404();
    }

    var service = new pb.CustomObjectService();
    service.loadTypeById(vars.id, function(err, custObjType) {
        if (util.isError(err)) {
            return self.serveError(err);
        }
        else if (!pb.utils.isObject(custObjType)) {
            return self.reqHandler.serve404();
        }

        service.findByTypeWithOrdering(custObjType, function(err, customObjects) {
		    if (util.isError(customObjects)) {
			    return self.reqHandler.serveError(err);
		    }

		    //none to manage
            if(customObjects.length === 0) {
                return self.redirect('/admin/content/custom_objects/new_object/' + vars.id, cb);
            }


            var pills = pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, 'manage_objects', custObjType);
            for(var i = 0; i < pills.length; i++) {
                if(pills[i].name == 'manage_objects') {
                    pills[i].title += ' (' + customObjects.length + ')';
                    break;
                }
            }

            var angularData = pb.js.getAngularController(
            {
                navigation: pb.AdminNavigation.get(self.session, ['content', 'custom_objects'], self.ls),
                pills: pills,
                customObjects: customObjects,
                objectType: custObjType
            }, [], 'initCustomObjectsPagination()');

            var title = self.ls.get('MANAGE') + ' ' + custObjType.name;
            self.setPageName(title);
            self.ts.registerLocal('angular_script', angularData);
            self.ts.load('admin/content/custom_objects/manage_objects', function(err, data) {
                var result = '' + data;
                cb({content: result});
            });
        });
    });
};

ManageObjects.getSubNavItems = function(key, ls, data) {
	return [
        {
            name: 'manage_objects',
            title: ls.get('MANAGE') + ' ' + data.name + ' ' + ls.get('OBJECTS'),
            icon: 'chevron-left',
            href: '/admin/content/custom_objects/manage_object_types'
        },
        {
            name: 'sort_objects',
            title: '',
            icon: 'sort-amount-desc',
            href: '/admin/content/custom_objects/sort_objects/' + data._id
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
pb.AdminSubnavService.registerFor(SUB_NAV_KEY, ManageObjects.getSubNavItems);

//exports
module.exports = ManageObjects;
