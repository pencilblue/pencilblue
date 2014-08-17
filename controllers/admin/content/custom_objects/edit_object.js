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
 * Interface for editing an object
 */

function EditObject() {}

//inheritance
util.inherits(EditObject, pb.BaseController);

var SUB_NAV_KEY = 'edit_custom_object';

EditObject.prototype.render = function(cb) {
	var self = this;
	var vars = this.pathVars;
    if(!vars.id) {
        self.redirect('/admin/content/custom_objects/manage_object_types', cb);
        return;
    }

    var service = new pb.CustomObjectService();
    service.loadById(vars.id, function(err, customObject) {
		if (util.isError(err)) {
			return self.reqHandler.serveError(err);
		}
        else if (!pb.utils.isObject(customObject)) {
            return self.reqHandler.serve404();
        }

        service.loadTypeById(customObject.type, function(err, custObjType) {
	        if (util.isError(err)) {
                return self.reqHandler.serveError(err);
            }


            EditObject.loadFieldOptions(service, custObjType, function(objectType) {
                var tabs   =
                [
                    {
                        active: 'active',
                        href: '#object_fields',
                        icon: 'list-ul',
                        title: self.ls.get('FIELDS')
                    }
                ];

                //TODO: experiment to see if this is needed.  Who makes guarantees about key ordering?
                var fieldOrder = [];
                for(var key in objectType.fields) {
                    fieldOrder.push(key);
                }

                var angularData = pb.js.getAngularController(
                {
                    navigation: pb.AdminNavigation.get(self.session, ['content', 'custom_objects'], self.ls),
                    pills: pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, null, {objectType: objectType, customObject: customObject}),
                    tabs: EditObject.getTabs(self.ls),
                    customObjectType: objectType,
                    customObject: customObject,
                    fieldOrder: fieldOrder
                }, [], 'initCustomObjectsPagination()');

                self.setPageName(self.ls.get('EDIT') + ' ' + customObject.name);
                self.ts.registerLocal('object_id', customObject._id);
                self.ts.registerLocal('angular_script', angularData);
                self.ts.registerLocal('custom_object_script', pb.js.getJSTag('var customObjectType = ' + JSON.stringify(objectType) + ';' + 'var customObject = ' + JSON.stringify(customObject)));
                self.ts.load('admin/content/custom_objects/edit_object',  function(err, data) {
                    var result = '' + data;
                    cb({content: result});
                });
            });
        });
    });
};

EditObject.getTabs = function(ls) {
    return [
        {
            active: 'active',
            href: '#object_fields',
            icon: 'list-ul',
            title: ls.get('FIELDS')
        }
    ];
};

EditObject.loadFieldOptions = function(service, objectType, cb) {
    var self = this;
    var keys = Object.keys(objectType.fields);
    var custObjTypes = {};
    var dao = new pb.DAO();

    //wrapper function to load cust object type
    var loadType = function(name, callback) {
        if (custObjTypes[name]) {
            return callback(null, custObjTypes[name]);
        }

        service.loadTypeByName(name, function(err, custObjType) {
            custObjTypes[name] = custObjType;
            callback(err, custObjType);
        });
    };

    this.loadObjectOptions = function(index) {
        if(index >= keys.length) {
            cb(objectType);
            return;
        }

        var key = keys[index];
        if(!pb.CustomObjectService.isReferenceFieldType(objectType.fields[key].field_type)) {
            index++;
            self.loadObjectOptions(index);
            return;
        }

        //field represents a reference to a custom field
        if(pb.CustomObjectService.isCustomObjectType(objectType.fields[key].object_type)) {

            loadType(objectType.fields[key].object_type, function(err, customObjectType) {
                if (util.isError(err)) {
		            //TODO handle this
                    pb.log.error(err.stack);
	            }

                //TODO: This is REALLY bad for large systems.  This needs to move to an API call (searchable and pagable)
                //TODO: decide if we should exclude the iD of the item we are working on
                var options = { select: { name: 1 } };
                service.findByType(customObjectType, options, function(err, customObjectsInfo) {
		            if (util.isError(err)) {
			            //TODO handle this
                        pb.log.error(err.stack);
		            }

		            objectType.fields[key].available_objects = customObjectsInfo;
		            index++;
		            self.loadObjectOptions(index);
	            });
            });

	        return;
        }

        //TODO: This is REALLY bad for large systems.  This needs to move to an API call (searchable and pagable)
        var select = {
            name: 1,
            headline: 1,
            first_name: 1,
            last_name: 1
        };
        dao.query(objectType.fields[key].object_type, pb.DAO.ANYWHERE, select).then(function(availableObjects) {
		    if (util.isError(availableObjects)) {
			    //TODO handle this
                pb.log.error(err.stack);
		    }

		    var objectsInfo = [];
		    for(var i = 0; i < availableObjects.length; i++)
	        {
	            objectsInfo.push({_id: availableObjects[i]._id, name: availableObjects[i].name || availableObjects[i].headline || (availableObjects[i].first_name + ' ' + availableObjects[i].last_name)});
	        }

	        objectType.fields[key].available_objects = objectsInfo;
	        index++;
	        self.loadObjectOptions(index);
	    });
    };

    this.loadObjectOptions(0);
};

EditObject.getSubNavItems = function(key, ls, data) {
	return [
        {
            name: 'manage_objects',
            title: ls.get('EDIT') +' ' + data.customObject.name,
            icon: 'chevron-left',
            href: '/admin/content/custom_objects/manage_objects/' + data.objectType._id
        },
        {
            name: 'new_object',
            title: '',
            icon: 'plus',
            href: '/admin/content/custom_objects/new_object/' + data.objectType._id
        }
    ];
};

//register admin sub-nav
pb.AdminSubnavService.registerFor(SUB_NAV_KEY, EditObject.getSubNavItems);

//exports
module.exports = EditObject;
