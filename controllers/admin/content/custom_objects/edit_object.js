/**
 * Manage custom objects via a table
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function EditObject() {}

//inheritance
util.inherits(EditObject, pb.BaseController);

EditObject.prototype.render = function(cb) {
	var self = this;
	var vars = this.pathVars;
    if(!vars['type'] || !vars['name']) {
        cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/custom_objects/manage_object_types'));
        return;
    }
	
	var dao  = new pb.DAO();
	dao.query('custom_object_type', {name: vars['type']}).then(function(customObjectTypes) {
		if (util.isError(customObjectTypes)) {
			//TODO handle this
		}
		
		//none to manage
        if(customObjectTypes.length == 0) {                
            cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/custom_objects/manage_object_types'));
            return;
        }
        
        EditObject.loadFieldOptions(dao, customObjectTypes[0], function(objectType) {
            dao.query('custom_object', {type: objectType._id.toString(), name: vars['name']}).then(function(customObjects) {
		        if (util.isError(customObjectTypes)) {
			        //TODO handle this
		        }
		
		        //none to manage
                if(customObjects.length == 0) {                
                    cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/custom_objects/manage_objects/' + objectType.name));
                    return;
                }
                
                var customObject = customObjects[0];
                
                self.setPageName(self.ls.get('EDIT') + ' ' + customObject.name);
                self.ts.registerLocal('object_id', customObject._id);
                self.ts.load('admin/content/custom_objects/edit_object',  function(err, data) {
                    var result = ''+data;
                    var tabs   =
                    [
                        {
                            active: 'active',
                            href: '#object_fields',
                            icon: 'list-ul',
                            title: self.ls.get('FIELDS')
                        }
                    ];
                    
                    var fieldOrder = [];
                    for(var key in objectType.fields) {
                        fieldOrder.push(key);
                    }
                        
                    var pills =
                    [
                        {
                            name: 'manage_objects',
                            title: self.ls.get('NEW') +' ' + objectType.name,
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
                        tabs: tabs,
                        customObjectType: objectType,
                        customObject: customObject,
                        fieldOrder: fieldOrder
                    }, [], 'initCustomObjectsPagination()'));
                    
                    result += pb.js.getJSTag('var customObjectType = ' + JSON.stringify(objectType));
                    result += pb.js.getJSTag('var customObject = ' + JSON.stringify(customObject));

                    cb({content: result});
                });
            });
        });
    });
};

EditObject.loadFieldOptions = function(dao, objectType, cb) {
    var self = this;
    var keys = [];
    
    for(var key in objectType.fields) {
        keys.push(key);
    }
    
    this.loadObjectOptions = function(index) {
        if(index >= keys.length) {
            cb(objectType);
            return;
        }
        
        var key = keys[index];
        
        if(objectType.fields[key].field_type != 'peer_object' && objectType.fields[key].field_type != 'child_objects') {
            index++;
            self.loadObjectOptions(index);
            return;
        }
        
        if(objectType.fields[key].object_type.indexOf('custom:') > -1) {
            var customObjectTypeName = objectType.fields[key].object_type.split('custom:').join('');
            dao.query('custom_object_type', {name: customObjectTypeName}).then(function(customObjectTypes)
            {
                if (util.isError(customObjectTypes)) {
		            //TODO handle this
	            }
	            
	            if(customObjectTypes.length == 0)
	            {
	                return;
	            }
	            
	            var customObjectType = customObjectTypes[0];
            
                dao.query('custom_object', {type: customObjectType._id.toString()}).then(function(customObjects) {
		            if (util.isError(customObjects)) {
			            //TODO handle this
		            }
		            
		            var customObjectsInfo = [];
		            for(var i = 0; i < customObjects.length; i++)
		            {
		                customObjectsInfo.push({_id: customObjects[i]._id, name: customObjects[i].name});
		            }
		            
		            objectType.fields[key].available_objects = customObjectsInfo;
		            index++;
		            self.loadObjectOptions(index);
	            });
            });
	        
	        return;
        }
        
        dao.query(objectType.fields[key].object_type, pb.DAO.ANYWHERE, pb.DAO.PROJECT_ALL).then(function(availableObjects) {
		    if (util.isError(availableObjects)) {
			    //TODO handle this
		    }
		    
		    var objectsInfo = [];
		    for(var i = 0; i < availableObjects.length; i++)
	        {
	            objectsInfo.push({_id: availableObjects[i]._id, name: (availableObjects[i].name) ? availableObjects[i].name : availableObjects[i].headline});
	        }
	        
	        objectType.fields[key].available_objects = objectsInfo;
	        index++;
	        self.loadObjectOptions(index);
	    });
    };
    
    this.loadObjectOptions(0);
};

//exports
module.exports = EditObject;
