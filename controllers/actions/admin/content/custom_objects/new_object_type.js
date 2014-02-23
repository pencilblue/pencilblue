/**
 * NewObjectType - Interface for adding a new custom object type
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function NewObjectType(){}

//inheritance
util.inherits(NewObjectType, pb.FormController);
                   
NewObjectType.prototype.onPostParamsRetrieved = function(post, cb) {
	var self    = this;
	var message = this.hasRequiredParams(post, ['name']);
	if(message) {
        this.formError(message, '/admin/content/custom_objects/new_object_type', cb);
        return;
    }

    var dao = new pb.DAO();
    // Check for duplicate name
    dao.query('custom_object_type', pb.DAO.ANYWHERE, pb.DAO.PROJECT_ALL).then(function(customObjectTypes) {
		if (util.isError(customObjectTypes)) {
			//TODO handle this
		}
        
        // Case insensitive test for duplicate name
        for(var i =0; i < customObjectTypes.length; i++)
        {
            if(post['name'].toLowerCase() == customObjectTypes[i].name.toLowerCase())
            {
                self.formError('^loc_EXISTING_CUSTOM_OBJECT_TYPE^', '/admin/content/custom_objects/new_object_type', cb);
                return;
            }
        }
        
        // Check for duplicate url
        dao.count('custom_object_type', {url: post['url'].toLowerCase()}, function(err, count) {
            if(count > 0) {
                self.formError('^loc_EXISTING_CUSTOM_OBJECT_TYPE^', '/admin/content/custom_objects/new_object_type', cb);
                return;
            }
            
            dao.count('page', {url: post['url'].toLowerCase()}, function(err, count) {
                if(count > 0) {
                    self.formError('^loc_EXISTING_CUSTOM_OBJECT_TYPE^', '/admin/content/custom_objects/new_object_type', cb);
                    return;
                }
                
                objectTypeDocument = NewObjectType.createObjectTypeDocument(post);
                if(!objectTypeDocument)
                {
                    self.formError('^loc_DUPLICATE_FIELD_NAME^', '/admin/content/custom_objects/new_object_type', cb);
                    return;
                }
                
                
                dao.update(objectTypeDocument).then(function(result) {
                    if(util.isError(result)) {
                        self.formError('^loc_ERROR_SAVING^', '/admin/content/custom_objects/new_object_type', cb);
                        return;
                    }
                    
                    self.session.success = objectTypeDocument.name + ' ^loc_CREATED^';
                    cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/custom_objects/new_object_type'));
                });
            });
        });
    });
};

NewObjectType.createObjectTypeDocument = function(post) {
    var objectTypeDocument = {object_type: 'custom_object_type', name: post['name'], url: post['url'], fields: {name: {field_type: 'text'}}};
    
    if(!post['field_order'])
    {
        return objectTypeDocument;
    }
    
    fieldOrder = post['field_order'].split(',');
    
    for(var i = 0; i < fieldOrder.length; i++)
    {
        var index = fieldOrder[i];
    
        if(post['value_' + index])
        {
            if(objectTypeDocument.fields[post['value_' + index]])
            {
                continue;
            }
            
            objectTypeDocument.fields[post['value_' + index]] = {field_type: post['field_type_' + index]};
        }
        else if(post['date_' + index])
        {
            if(objectTypeDocument.fields[post['date_' + index]])
            {
                continue;
            }
            
            objectTypeDocument.fields[post['date_' + index]] = {field_type: 'date'};
        }
        else if(post['peer_object_' + index])
        {
            if(objectTypeDocument.fields[post['peer_object_' + index]])
            {
                continue;
            }
            
            objectTypeDocument.fields[post['peer_object_' + index]] = {field_type: 'peer_object', object_type: post['field_type_' + index]};
        }
        else if(post['child_objects_' + index])
        {
            if(objectTypeDocument.fields[post['child_objects_' + index]])
            {
                continue;
            }
            
            objectTypeDocument.fields[post['child_objects_' + index]] = {field_type: 'child_objects', object_type: post['field_type_' + index]};
        }
    }
    
    return objectTypeDocument;
}

//exports 
module.exports = NewObjectType;
