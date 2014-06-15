/**
 * Manage custom objects via a table
 *
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
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
        cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/custom_objects/manage_object_types'));
        return;
    }

	var dao  = new pb.DAO();
	dao.loadById(vars.id, 'custom_object_type', function(err, objectType) {
        if(util.isError(err) || objectType === null) {
    		cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/custom_objects/manage_object_types'));
            return;
		}

        dao.query('custom_object', {type: objectType._id.toString()}).then(function(customObjects) {
		    if (util.isError(customObjects)) {
			    //TODO handle this
		    }

		    //none to manage
            if(customObjects.length === 0) {
                cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/custom_objects/new_object/' + vars.id));
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

		        var title = self.ls.get('MANAGE') + ' ' + objectType.name;
		        self.setPageName(title);
                self.ts.load('admin/content/custom_objects/manage_objects', function(err, data) {
                    var result = ''+data;

                    var pills = pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, 'manage_objects', objectType);
                    result    = result.split('^angular_script^').join(pb.js.getAngularController(
                    {
                        navigation: pb.AdminNavigation.get(self.session, ['content', 'custom_objects'], self.ls),
                        pills: pills,
                        customObjects: customObjects,
                        objectType: objectType
                    }, [], 'initCustomObjectsPagination()'));

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
