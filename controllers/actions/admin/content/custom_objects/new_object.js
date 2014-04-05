/**
 * NewObject - Interface for adding a new custom object type
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function NewObject(){}

//inheritance
util.inherits(NewObject, pb.FormController);
                   
NewObject.prototype.onPostParamsRetrieved = function(post, cb) {
	var self = this;
	var vars = this.pathVars;
	
	if(!vars['type_id']) {
	    cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/custom_objects/manage_object_types'));
	    return;
	}

    var dao = new pb.DAO();
    // Check for duplicate name
    dao.query('custom_object_type', {_id: ObjectID(vars['type_id'])}).then(function(customObjectTypes) {
		if (util.isError(customObjectTypes)) {
			//TODO handle this
		}
		
		if(customObjectTypes.length == 0)
		{
		    cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/custom_objects/manage_object_types'));
	        return;
		}
		
		var customObjectType = customObjectTypes[0];
		
		var message = self.hasRequiredParams(post, ['name']);
	    if(message) {
            self.formError(message, '/admin/content/custom_objects/new_object/' + customObjectType.name, cb);
            return;
        }
        
        // Test for duplicate name
        dao.query('custom_object', {type: vars['type_id'], name: post['name']}).then(function(customObjects) {
		    if (util.isError(customObjects)) {
			    //TODO handle this
		    }
		
		    if(customObjects.length > 0)
		    {
		        self.formError(self.ls.get('EXISTING_CUSTOM_OBJECT'), '/admin/content/custom_objects/new_object/' + customObjectType.name, cb);
                return;
		    }
		    
		    for(var key in customObjectType.fields)
		    {
		        if(customObjectType.fields[key].field_type == 'number')
		        {
		            if(post[key])
		            {
		                post[key] = parseFloat(post[key]);
		            }
		        }
		        else if(customObjectType.fields[key].field_type == 'date')
		        {
		            if(post[key])
		            {
		                post[key] = new Date(post[key]);
		            }
		        }
		        else if(customObjectType.fields[key].field_type == 'child_objects')
		        {
		            if(post[key])
		            {
		                post[key] = post[key].split(',');
		            }
		        }
		    }
		    
		    post['type'] = vars['type_id'];
		    var customObjectDocument = pb.DocumentCreator.create('custom_object', post);
            
            dao.update(customObjectDocument).then(function(result) {
                if(util.isError(result)) {
                    self.formError(self.ls.get('ERROR_SAVING'), '/admin/content/custom_objects/new_object/' + customObjectType.name, cb);
                    return;
                }
                
                self.session.success = customObjectDocument.name + ' ' + self.ls.get('CREATED');
                cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/custom_objects/new_object/' + customObjectType.name));
            });
        });
    });
};

//exports 
module.exports = NewObject;
