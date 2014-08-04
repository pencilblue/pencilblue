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
 * Creates an object type
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
        for(var i =0; i < customObjectTypes.length; i++) {
            if(post.name.toLowerCase() == customObjectTypes[i].name.toLowerCase())
            {
                self.formError(self.ls.get('EXISTING_CUSTOM_OBJECT_TYPE'), '/admin/content/custom_objects/new_object_type', cb);
                return;
            }
        }

        // Check for duplicate url
        dao.count('custom_object_type', {name: post.name.toLowerCase()}, function(err, count) {
            if(count > 0) {
                self.formError(self.ls.get('EXISTING_CUSTOM_OBJECT_TYPE'), '/admin/content/custom_objects/new_object_type', cb);
                return;
            }

            if(count > 0) {
                self.formError(self.ls.get('EXISTING_CUSTOM_OBJECT_TYPE'), '/admin/content/custom_objects/new_object_type', cb);
                return;
            }

            objectTypeDocument = self.createObjectTypeDocument(post);
            if(!objectTypeDocument)
            {
                self.formError(self.ls.get('INVALID_FIELD'), '/admin/content/custom_objects/new_object_type', cb);
                return;
            }


            dao.update(objectTypeDocument).then(function(result) {
                if(util.isError(result)) {
                    self.formError(self.ls.get('ERROR_SAVING'), '/admin/content/custom_objects/new_object_type', cb);
                    return;
                }

                self.session.success = objectTypeDocument.name + ' ' + self.ls.get('CREATED');
                self.redirect('/admin/content/custom_objects/new_object_type', cb);
            });
        });
    });
};

NewObjectType.prototype.createObjectTypeDocument = function(post) {
    var self = this;

    var objectTypeDocument = {object_type: 'custom_object_type', name: post.name, fields: {name: {field_type: 'text'}}};

    if(!post.field_order)
    {
        return objectTypeDocument;
    }

    fieldOrder = post.field_order.split(',');

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

            if(post['field_type_' + index] == self.ls.get('OBJECT_TYPE')) {
                return null;
            }

            objectTypeDocument.fields[post['peer_object_' + index]] = {field_type: 'peer_object', object_type: post['field_type_' + index]};
        }
        else if(post['child_objects_' + index])
        {
            if(objectTypeDocument.fields[post['child_objects_' + index]])
            {
                continue;
            }

            if(post['field_type_' + index] == self.ls.get('OBJECT_TYPE')) {
                return null;
            }

            objectTypeDocument.fields[post['child_objects_' + index]] = {field_type: 'child_objects', object_type: post['field_type_' + index]};
        }
    }

    return objectTypeDocument;
};

//exports
module.exports = NewObjectType;
