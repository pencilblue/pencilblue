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
        self.redirect('/admin/content/custom_objects/manage_object_types', cb);
        return;
    }

	var dao  = new pb.DAO();
	dao.loadById(vars.id, 'custom_object_type', function(err, objectType) {
        if(util.isError(err) || objectType === null) {
    		self.redirect('/admin/content/custom_objects/manage_object_types', cb);
            return;
		}

        dao.query('custom_object', {type: objectType._id.toString()}).then(function(customObjects) {
		    if (util.isError(customObjects)) {
			    //TODO handle this
		    }

		    //none to manage
            if(customObjects.length === 0) {
                self.redirect('/admin/content/custom_objects/new_object/' + vars.id, cb);
                return;
            }

            dao.query('custom_object_sort', {custom_object_type: objectType._id.toString()}).then(function(customObjectSorts) {
		        if (util.isError(customObjects)) {
			        //TODO handle this
		        }

		        if(customObjectSorts.length === 0) {
                    //currently, mongo cannot do case-insensitive sorts.  We do it manually
                    //until a solution for https://jira.mongodb.org/browse/SERVER-90 is merged.
                    customObjects.sort(function(a, b) {
                        var x = a.name.toLowerCase();
                        var y = b.name.toLowerCase();

                        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
                    });
                }
                else
                {
                    var customObjectSort = customObjectSorts[0].sorted_objects;
                    var sortedObjects = [];
                    for(var i = 0; i < customObjectSort.length; i++)
                    {
                        for(var j = 0; j < customObjects.length; j++)
                        {
                            if(customObjects[j]._id.equals(ObjectID(customObjectSort[i])))
                            {
                                sortedObjects.push(customObjects[j]);
                                customObjects.splice(j, 1);
                                break;
                            }
                        }
                    }

                    sortedObjects.concat(customObjects);
                    customObjects = sortedObjects;
                }

                var pills = pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, 'manage_objects', objectType);
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
                    objectType: objectType
                }, [], 'initCustomObjectsPagination()');

		        var title = self.ls.get('MANAGE') + ' ' + objectType.name;
		        self.setPageName(title);
                self.ts.registerLocal('angular_script', angularData);
                self.ts.load('admin/content/custom_objects/manage_objects', function(err, data) {
                    var result = '' + data;
                    cb({content: result});
                });
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
