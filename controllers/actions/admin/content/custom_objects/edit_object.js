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
 * Edits an object
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
                    self.redirect('/admin/content/custom_objects/manage_objects/' + customObjectType._id, cb);
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
