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
var EditObject = require('./edit_object.js');

/**
 * Interface for creating a new object
 * @class NewObject
 * @constructor
 */
function NewObject() {}

//inheritance
util.inherits(NewObject, pb.BaseController);

//statics
var SUB_NAV_KEY = 'new_custom_object';

NewObject.prototype.render = function(cb) {
	var self = this;
	var vars = this.pathVars;
    if(!vars.type_id) {
        self.redirect('/admin/content/custom_objects/manage_object_types', cb);
        return;
    }

    var service = new pb.CustomObjectService();
    service.loadTypeById(vars.type_id, function(err, objectType) {
		if(util.isError(err)) {
            return self.reqHandler.serveError(err);
        }
        else if (!pb.utils.isObject(objectType)) {
            return self.reqHandler.serve404();
        }

        EditObject.loadFieldOptions(service, objectType, function(objectType) {
            var tabs = NewObject.getTabs(self.ls);

            var fieldOrder = [];
            for(var key in objectType.fields)
            {
                fieldOrder.push(key);
            }

            service.countByType(objectType, function(err, custObjCnt) {
                if (util.isError(err)) {
                    //TODO handle error
                    pb.log.error(err.stack);
                }

                var pills = pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, null, objectType);
                if(custObjCnt === 0) {
                    pills[0].href = '/admin/content/custom_objects/manage_object_types';
                }

                var angularData = pb.js.getAngularController(
                {
                    navigation: pb.AdminNavigation.get(self.session, ['content', 'custom_objects'], self.ls),
                    pills: pills,
                    tabs: tabs,
                    customObjectType: objectType,
                    fieldOrder: fieldOrder
                }, [], 'initCustomObjectsPagination()');

                var title = self.ls.get('NEW') + ' ' + objectType.name;
                self.setPageName(title);
                self.ts.registerLocal('object_type_id', objectType._id);
                self.ts.registerLocal('angular_script', angularData);
                self.ts.registerLocal('custom_object_script', pb.js.getJSTag('var customObjectType = ' + JSON.stringify(objectType)));
                self.ts.load('admin/content/custom_objects/new_object', function(err, data) {
                    self.checkForFormRefill('' + data, function(result) {
                        cb({content: result});
                    });
                });
            });
        });
    });
};

NewObject.getTabs = function(ls) {
    return [
        {
            active: 'active',
            href: '#object_fields',
            icon: 'list-ul',
            title: ls.get('FIELDS')
        }
    ];
};

NewObject.getSubNavItems = function(key, ls, data) {
	return [
        {
            name: 'manage_objects',
            title: ls.get('NEW') + ' ' + data.name,
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
pb.AdminSubnavService.registerFor(SUB_NAV_KEY, NewObject.getSubNavItems);

//exports
module.exports = NewObject;
