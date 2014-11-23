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

function ObjectForm() {}

//inheritance
util.inherits(ObjectForm, pb.BaseController);

var SUB_NAV_KEY = 'object_form';

ObjectForm.prototype.render = function(cb) {
    var self = this;
    var vars = this.pathVars;

    var message = this.hasRequiredParams(vars, ['type_id']);
    if(message) {
        self.redirect('/admin/content/objects/types', cb);
        return;
    }

    this.gatherData(vars, function(err, data) {
        if (util.isError(err)) {
            throw err;
        }
        else if(!data.customObject) {
            self.reqHandler.serve404();
            return;
        }

        // Remove active child objects from available objects list
        if(data.customObject._id) {
            for(var i = 0; i < data.objectType.fields.length; i++) {
                if(data.objectType.fields[i].field_type === 'child_objects') {
                    for(var j = 0; j < data.customObject[data.objectType.fields[i].name].length; j++) {
                        for(var s = 0; s < data.objectType.fields[i].available_objects.length; s++) {
                            if(data.customObject[data.objectType.fields[i].name][j]._id.equals(data.objectType.fields[i].available_objects[s]._id)) {
                                data.objectType.fields[i].available_objects.splice(s, 1);
                                break;
                            }
                        }
                    }
                }
            }
        }

        self.objectType = data.objectType;
        self.customObject = data.customObject;
        data.pills = pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, SUB_NAV_KEY, {objectType: self.objectType, customObject: self.customObject});
        var angularObjects = pb.js.getAngularObjects(data);

        self.setPageName(self.customObject._id ? self.customObject.name : self.ls.get('NEW') + ' ' + self.objectType.name + ' ' + self.ls.get('OBJECT'));
        self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
        self.ts.load('admin/content/objects/object_form',  function(err, result) {
            cb({content: result});
        });
    });
};

ObjectForm.prototype.gatherData = function(vars, cb) {
    var self = this;
    var cos = new pb.CustomObjectService();

    var tasks = {
        tabs: function(callback) {
            var tabs = [
                {
                    active: 'active',
                    href: '#object_fields',
                    icon: 'list-ul',
                    title: self.ls.get('FIELDS')
                }
            ];

            callback(null, tabs);
        },

        navigation: function(callback) {
            callback(null, pb.AdminNavigation.get(self.session, ['content', 'custom_objects'], self.ls));
        },

        objectType: function(callback) {
            cos.loadTypeById(vars.type_id, function(err, objectType) {
                if(util.isError(err)) {
                    callback(err, customObject);
                    return;
                }

                self.loadFieldOptions(cos, objectType, function(objectType) {
                    callback(err, objectType);
                });
            });
        },

        customObject: function(callback) {
            if(!vars.id) {
                callback(null, {});
                return;
            }

            cos.loadById(vars.id, {fetch_depth: 1}, function(err, customObject) {
                callback(err, customObject);
            });
        }
    };
    async.series(tasks, cb);
};

ObjectForm.prototype.loadFieldOptions = function(service, objectType, cb) {
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
            self.convertFieldsToArray();
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

    this.convertFieldsToArray = function() {
        delete objectType.fields.name;

        var fieldsArray = [{name: 'name', field_type: 'text'}];
        for(var key in objectType.fields) {
            var field = JSON.parse(JSON.stringify(objectType.fields[key]));
            field.name = key;
            fieldsArray.push(field);
        }

        objectType.fields = fieldsArray;
        cb(objectType);
    };

    this.loadObjectOptions(0);
};

ObjectForm.getSubNavItems = function(key, ls, data) {
    return [
        {
            name: 'manage_objects',
            title: data.customObject._id ? ls.get('EDIT') + ' ' + data.customObject.name : ls.get('NEW') + ' ' + data.objectType.name + ' ' + ls.get('OBJECT'),
            icon: 'chevron-left',
            href: '/admin/content/objects/' + data.objectType._id
        },
        {
            name: 'new_object',
            title: '',
            icon: 'plus',
            href: '/admin/content/objects/' + data.objectType._id + '/new'
        }
    ];
};

//register admin sub-nav
pb.AdminSubnavService.registerFor(SUB_NAV_KEY, ObjectForm.getSubNavItems);

//exports
module.exports = ObjectForm;
