/*
    Copyright (C) 2015  PencilBlue, LLC

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
var async = require('async');

module.exports = function(pb) {
    
    //pb dependencies
    var util = pb.util;
    
    /**
     * Interface for editing an object
     * @class ObjectFormController
     * @constructor
     */
    function ObjectFormController() {}
    util.inherits(ObjectFormController, pb.BaseAdminController);

    var SUB_NAV_KEY = 'object_form';

    ObjectFormController.prototype.render = function(cb) {
        var self = this;
        var vars = this.pathVars;

        if(!pb.validation.isIdStr(vars.type_id, true)) {
            return self.redirect('/admin/content/objects/types', cb);
        }

        this.gatherData(vars, function(err, data) {
            if (util.isError(err)) {
                return self.reqHandler.serveError(err);
            }
            else if(!data.customObject) {
                return self.reqHandler.serve404();
            }

            //TODO: exclude the IDs from the load options query when type is child objects
            // Remove active child objects from available objects list
            if(data.customObject[pb.DAO.getIdField()]) {

                //iterate over fields
                for(var i = 0; i < data.objectType.fields.length; i++) {
                    var custObjField = data.objectType.fields[i];

                    //perform operation only when field type is child objects
                    if(custObjField.field_type === 'child_objects') {

                        //iterate over objects selected for the child objects field
                        for(var j = 0; j < data.customObject[custObjField.name].length; j++) {
                            var associatedObj = data.customObject[custObjField.name][j];

                            //iterate over the entire list of possible objects that could be linked back as a child object
                            for(var s = 0; s < custObjField.available_objects.length; s++) {
                                var availableObj = custObjField.available_objects[s];

                                //when an associated child object is found in the overall list of items
                                if(pb.DAO.areIdsEqual(associatedObj[pb.DAO.getIdField()], availableObj[pb.DAO.getIdField()])) {

                                    //remove it from the list of possible objects to choose from
                                    custObjField.available_objects.splice(s, 1);
                                    break;
                                }
                            }
                        }
                    }
                }
            }

            self.objectType = data.objectType;
            self.customObject = data.customObject;
            data.pills = self.getAdminPills(SUB_NAV_KEY, self.ls, SUB_NAV_KEY, {objectType: self.objectType, customObject: self.customObject});
            var angularObjects = pb.ClientJs.getAngularObjects(data);

            self.setPageName(self.customObject[pb.DAO.getIdField()] ? self.customObject.name : self.ls.get('NEW') + ' ' + self.objectType.name + ' ' + self.ls.get('OBJECT'));
            self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
            self.ts.load('admin/content/objects/object_form',  function(err, result) {
                cb({content: result});
            });
        });
    };

    ObjectFormController.prototype.gatherData = function(vars, cb) {
        var self = this;
        var cos = new pb.CustomObjectService(self.site, true);

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
                callback(null, pb.AdminNavigation.get(self.session, ['content', 'custom_objects'], self.ls, self.site));
            },

            objectType: function(callback) {
                cos.loadTypeById(vars.type_id, function(err, objectType) {
                    if(util.isError(err)) {
                        callback(err, customObject);
                        return;
                    }

                    if (!util.isObject(objectType)) {
                        return self.reqHandler.serve404();
                    }

                    self.loadFieldOptions(cos, objectType, callback);
                });
            },

            customObject: function(callback) {
                if(!vars.id) {
                    callback(null, {});
                    return;
                }

                cos.loadById(vars.id, {fetch_depth: 1}, callback);
            }
        };
        async.series(tasks, cb);
    };

    ObjectFormController.prototype.loadFieldOptions = function(service, objectType, cb) {
        var self         = this;
        var keys         = Object.keys(objectType.fields);
        var custObjTypes = {};
        var userService  = new pb.UserService();

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

        var tasks = util.getTasks(keys, function(keys, i) {
            return function(callback) {

                //only proceed for peer or child object types
                var key = keys[i];
                if(!pb.CustomObjectService.isReferenceFieldType(objectType.fields[key].field_type)) {
                    return callback();
                }

                //field represents a reference to a custom field
                if(pb.CustomObjectService.isCustomObjectType(objectType.fields[key].object_type)) {

                    loadType(objectType.fields[key].object_type, function(err, customObjectType) {
                        if (util.isError(err)) {
                            return callback(err);
                        }

                        //TODO: This is REALLY bad for large systems.  This needs to move to an API call (searchable and pagable)
                        //TODO: decide if we should exclude the iD of the item we are working on
                        var options = { select: { name: 1 } };
                        service.findByType(customObjectType, options, function(err, customObjectsInfo) {
                            if (util.isError(err)) {
                                return callback(err);
                            }

                            objectType.fields[key].available_objects = customObjectsInfo;
                            callback();
                        });
                    });
                    return;
                }

                //TODO: This is REALLY bad for large systems.  This needs to move 
                //to an API call (searchable and pagable)
                var query = {
                    where: pb.DAO.ANYWHERE,
                    select: {
                        name: 1,
                        headline: 1,
                        first_name: 1,
                        last_name: 1
                    }
                };
                self.siteQueryService.q(objectType.fields[key].object_type, query, function(err, availableObjects) {
                    if (util.isError(err)) {
                        return callback(err);
                    }

                    var objectsInfo = [];
                    for(var i = 0; i < availableObjects.length; i++) {

                        var descriptor = {
                            name: availableObjects[i].name || availableObjects[i].headline || userService.getFormattedName(availableObjects[i])
                        };
                        descriptor[pb.DAO.getIdField()] = availableObjects[i][pb.DAO.getIdField()];
                        objectsInfo.push(descriptor);
                    }

                    objectType.fields[key].available_objects = objectsInfo;
                    callback();
                });
            };
        });
        async.parallel(tasks, function(err, results) {

            //TODO find out why we do this
            delete objectType.fields.name;

            var fieldsArray = [{name: 'name', field_type: 'text'}];
            for(var key in objectType.fields) {
                var field = JSON.parse(JSON.stringify(objectType.fields[key]));
                field.name = key;
                fieldsArray.push(field);
            }

            objectType.fields = fieldsArray;
            cb(err, objectType);
        });
    };

    ObjectFormController.getSubNavItems = function(key, ls, data) {
        return [
            {
                name: 'manage_objects',
                title: data.customObject[pb.DAO.getIdField()] ? ls.get('EDIT') + ' ' + data.customObject.name : ls.get('NEW') + ' ' + data.objectType.name + ' ' + ls.get('OBJECT'),
                icon: 'chevron-left',
                href: '/admin/content/objects/' + data.objectType[pb.DAO.getIdField()]
            },
            {
                name: 'new_object',
                title: '',
                icon: 'plus',
                href: '/admin/content/objects/' + data.objectType[pb.DAO.getIdField()] + '/new'
            }
        ];
    };

    //register admin sub-nav
    pb.AdminSubnavService.registerFor(SUB_NAV_KEY, ObjectFormController.getSubNavItems);

    //exports
    return ObjectFormController;
};
