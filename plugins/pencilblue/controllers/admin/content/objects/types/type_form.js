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
     * Interface for creating and editing custom object types
     */
    function TypeForm(){}
    util.inherits(TypeForm, pb.BaseAdminController);

    //statics
    var SUB_NAV_KEY = 'type_form';

    TypeForm.prototype.render = function(cb) {
        var self = this;
        var vars = this.pathVars;

        this.gatherData(vars, function(err, data) {
            if (util.isError(err)) {
                throw err;
            }
            else if(!data.objectType) {
                self.reqHandler.serve404();
                return;
            }

            self.objectType = data.objectType;
            data.pills = self.getAdminPills(SUB_NAV_KEY, self.ls, SUB_NAV_KEY, data);
            var angularObjects = pb.ClientJs.getAngularObjects(data);
            self.setPageName(self.objectType[pb.DAO.getIdField()] ? self.objectType.name : self.ls.get('NEW_OBJECT'));
            self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
            self.ts.load('admin/content/objects/types/type_form', function(err, result) {
                cb({content: result});
            });
        });
    };

    TypeForm.prototype.gatherData = function(vars, cb) {
        var self = this;
        var cos = new pb.CustomObjectService(self.site, true);

        var tasks = {
            tabs: function(callback) {
                var tabs = [
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

                callback(null, tabs);
            },

            navigation: function(callback) {
                callback(null, pb.AdminNavigation.get(self.session, ['content', 'custom_objects'], self.ls, self.site));
            },

            objectTypes: function(callback) {
                cos.getReferenceTypes(function(err, objectTypes) {
                    callback(err, objectTypes);
                });
            },

            objectType: function(callback) {
                if(!vars.id) {
                    var objectType = {
                        fields: {}
                    };
                    callback(null, objectType);
                    return;
                }

                cos.loadTypeById(vars.id, function(err, objectType) {
                    delete objectType.fields.name;
                    callback(err, objectType);
                });
            }
        };
        async.series(tasks, cb);
    };

    TypeForm.getSubNavItems = function(key, ls, data) {
        return [{
            name: SUB_NAV_KEY,
            title: data.objectType[pb.DAO.getIdField()] ? ls.get('EDIT') + ' ' + data.objectType.name : ls.get('NEW_OBJECT_TYPE'),
            icon: 'chevron-left',
            href: '/admin/content/objects/types'
        }, {
            name: 'new_object_type',
            title: '',
            icon: 'plus',
            href: '/admin/content/objects/types/new'
        }];
    };

    //register admin sub-nav
    pb.AdminSubnavService.registerFor(SUB_NAV_KEY, TypeForm.getSubNavItems);

    //exports
    return TypeForm;
};
