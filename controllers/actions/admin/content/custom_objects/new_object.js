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
 * Creates an object
 */

function NewObject(){}

//inheritance
util.inherits(NewObject, pb.FormController);

NewObject.prototype.onPostParamsRetrieved = function(post, cb) {
	var self = this;
	var vars = this.pathVars;

	if(!vars.type_id) {
	    self.redirect('/admin/content/custom_objects/manage_object_types', cb);
	    return;
	}

    var dao = new pb.DAO();
    // Check for duplicate name
    dao.query('custom_object_type', {_id: ObjectID(vars.type_id)}).then(function(customObjectTypes) {
		if (util.isError(customObjectTypes)) {
			//TODO handle this
		}

		if(customObjectTypes.length === 0)
		{
		    self.redirect('/admin/content/custom_objects/manage_object_types', cb);
	        return;
		}

		var customObjectType = customObjectTypes[0];

		var message = self.hasRequiredParams(post, ['name']);
	    if(message) {
            self.formError(message, '/admin/content/custom_objects/new_object/' + customObjectType._id, cb);
            return;
        }

        // Test for duplicate name
        dao.count('custom_object', {type: vars.type_id, name: post.name}, function(err, count) {
		    if (util.isError(err)) {
                self.reqHandler.serveError(err);
                return;
		    }

		    if(count > 0) {
                self.setFormFieldValues(post);
		        self.formError(self.ls.get('EXISTING_CUSTOM_OBJECT'), '/admin/content/custom_objects/new_object/' + customObjectType._id, cb);
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

		    post.type = vars.type_id;
		    var customObjectDocument = pb.DocumentCreator.create('custom_object', post);

            dao.update(customObjectDocument).then(function(result) {
                if(util.isError(result)) {
                    self.formError(self.ls.get('ERROR_SAVING'), '/admin/content/custom_objects/new_object/' + customObjectType._id, cb);
                    return;
                }

                self.session.success = customObjectDocument.name + ' ' + self.ls.get('CREATED');
                self.redirect('/admin/content/custom_objects/new_object/' + customObjectType._id, cb);
            });
        });
    });
};

//exports
module.exports = NewObject;
