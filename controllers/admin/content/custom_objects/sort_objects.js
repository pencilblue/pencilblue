/**
 * Sort custom objects via drag and drop
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function SortObjects() {}

//inheritance
util.inherits(SortObjects, pb.BaseController);

SortObjects.prototype.render = function(cb) {
	var self = this;
	var vars = this.pathVars;
    if(!vars['name']) {
        cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/custom_objects/manage_object_types'));
        return;
    }
	
	var dao  = new pb.DAO();
	dao.query('custom_object_type', {name: vars['name']}).then(function(customObjectTypes) {
		if (util.isError(customObjectTypes)) {
			//TODO handle this
		}
		
		//none to manage
        if(customObjectTypes.length == 0) {                
            cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/custom_objects/manage_object_types'));
            return;
        }
        
        var objectType = customObjectTypes[0];
        
        dao.query('custom_object', {type: objectType._id.toString()}).then(function(customObjects) {
		    if (util.isError(customObjects)) {
			    //TODO handle this
		    }
		
		    //none to manage
            if(customObjects.length == 0) {                
                cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/custom_objects/new_object/' + vars['name']));
                return;
            }
            
            dao.query('custom_object_sort', {custom_object_type: objectType._id.toString()}).then(function(customObjectSorts) {
		        if (util.isError(customObjects)) {
			        //TODO handle this
		        }
		        
		        if(customObjectSorts.length == 0) {
                    //currently, mongo cannot do case-insensitive sorts.  We do it manually 
                    //until a solution for https://jira.mongodb.org/browse/SERVER-90 is merged.
                    customObjects.sort(function(a, b) {
                        var x = a['name'].toLowerCase();
                        var y = b['name'].toLowerCase();
                    
                        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
                    });
                }
                else
                {
                    var customObjectSort = customObjectSorts[0].sorted_objects;
                    var sortedObjects    = [];
                    for (var i = 0; i < customObjectSort.length; i++) {
                        for (var j = 0; j < customObjects.length; j++) {
                            if (customObjects[j]._id.equals(ObjectID(customObjectSort[i]))) {
                                sortedObjects.push(customObjects[j]);
                                customObjects.splice(j, 1);
                                break;
                            }
                        }
                    }
                    
                    sortedObjects.concat(customObjects);
                    customObjects = sortedObjects;
                }
        
		        self.setPageName(self.ls.get('MANAGE') + ' ' + objectType.name);
		        self.ts.registerLocal('object_type_id', objectType._id);
                self.ts.registerLocal('object_type_name', objectType.name);
                self.ts.load('admin/content/custom_objects/sort_objects', function(err, data) {
                    var result = ''+data;
                        
                    var pills =
                    [
                        {
                            name: 'manage_objects',
                            title: self.ls.get('SORT') + ' ' + objectType.name + ' ' + self.ls.get('OBJECTS'),
                            icon: 'chevron-left',
                            href: '/admin/content/custom_objects/manage_objects/' + objectType.name
                        },
                        {
                            name: 'new_object',
                            title: '',
                            icon: 'plus',
                            href: '/admin/content/custom_objects/new_object/' + objectType.name
                        }
                    ];
                    
                    result = result.concat(pb.js.getAngularController(
                    {
                        navigation: pb.AdminNavigation.get(self.session, ['content', 'custom_objects'], self.ls),
                        pills: pills,
                        customObjects: customObjects,
                        objectType: objectType
                    }));
                    
                    var content = self.localizationService.localize(['admin', 'custom_objects'], result);
                    cb({content: content});
                });
            });
        });
    });
};

//exports
module.exports = SortObjects;
