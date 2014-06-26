/**
 * EditObject - Interface for adding a new custom object type
 *
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function EditObject(){}

//inheritance
util.inherits(EditObject, pb.FormController);

EditObject.prototype.onPostParamsRetrieved = function(post, cb) {
	var self = this;
	var vars = this.pathVars;

	if(!vars.id)
	{
	    cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/custom_objects/manage_object_types'));
	    return;
	}

    var dao = new pb.DAO();
    // Check for duplicate name
    dao.query('custom_object', {_id: ObjectID(vars.id)}).then(function(customObjects) {
		if (util.isError(customObjects)) {
			//TODO handle this
		}

		if(customObjects.length === 0)
		{
		    cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/custom_objects/manage_object_types'));
	        return;
		}

		var customObject = customObjects[0];

        // Test for duplicate name
        dao.query('custom_object_type', {_id: ObjectID(customObject.type)}).then(function(customObjectTypes) {
	        if (util.isError(customObjectTypes)) {
		        //TODO handle this
	        }

	        if(customObjectTypes.length === 0)
	        {
	            cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/custom_objects/manage_object_types'));
                return;
	        }

	        var customObjectType = customObjectTypes[0];

	        EditObject.validateName(dao, post, customObject, function(isValidName)
		    {
                if(!isValidName)
                {
                    self.formError(self.ls.get('EXISTING_OBJECT'), '/admin/content/custom_objects/edit_object/' +  vars.id, cb);
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
	                else if(customObjectType.fields[key].field_type == 'child_objects') {
	                    if(post[key]) {
	                        post[key] = post[key].split(',');
	                    }
	                }
	            }

	            post.type = customObject.type;
	            var customObjectDocument = pb.DocumentCreator.create('custom_object', post);
	            customObjectDocument._id = customObject._id;

                dao.update(customObjectDocument).then(function(result) {
                    if(util.isError(result)) {
                        self.formError(self.ls.get('ERROR_SAVING'), '/admin/content/custom_objects/edit_object/' + vars.id, cb);
                        return;
                    }

                    self.session.success = customObjectDocument.name + ' ' + self.ls.get('EDITED');
                    cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/custom_objects/manage_objects/' + customObjectType._id));
                });
            });
        });
    });
};

EditObject.validateName = function(dao, post, customObject, cb) {
    if(post.name == customObject.name) {
        cb(true);
        return;
    }

    dao.query('custom_object', {type: customObject.type}).then(function(customObjects) {
        for(var i = 0; i < customObjects.length; i++) {
            if(customObjects[i].name == post.name) {
                cb(false);
                return;
            }
        }
    });

    cb(true);
};

//exports
module.exports = EditObject;
