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
 * Sets the sorting of objects
 */

function SortObjects(){}

//inheritance
util.inherits(SortObjects, pb.FormController);

SortObjects.prototype.onPostParamsRetrieved = function(post, cb) {
	var self = this;
	var vars = this.pathVars;

	if(!vars.type_id)
	{
	    cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/custom_objects/manage_object_types'));
	    return;
	}

	var dao = new pb.DAO();
    dao.query('custom_object_type', {_id: ObjectID(vars.type_id)}).then(function(customObjectTypes) {
		if (util.isError(customObjectTypes)) {
			//TODO handle this
		}

		if(customObjectTypes.length === 0)
		{
		    cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/custom_objects/manage_object_types'));
	        return;
		}

		var customObjectType = customObjectTypes[0];

	    post.custom_object_type = vars.type_id;
	    var sortDocument = pb.DocumentCreator.create('custom_object_sort', post, ['sorted_objects']);

	    if(sortDocument.sorted_objects.length === 0)
	    {
	        self.formError(self.ls.get('ERROR_SAVING'), '/admin/content/custom_objects/sort_objects/' + customObjectType.name, cb);
            return;
	    }

        dao.query('custom_object_sort', {custom_object_type: vars.type_id}).then(function(customObjectSorts) {
		    if (util.isError(customObjectTypes)) {
			    //TODO handle this
		    }

		    if(customObjectSorts.length > 0)
		    {
		        sortDocument._id = customObjectSorts[0]._id;
		    }

            dao.update(sortDocument).then(function(result) {
                if(util.isError(result)) {
                    self.formError(self.ls.get('ERROR_SAVING'), '/admin/content/custom_objects/sort_objects/' + customObjectType._id, cb);
                    return;
                }

                self.session.success = customObjectType.name + ' ' + self.ls.get('SORT_SAVED');
                cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/custom_objects/manage_objects/' + customObjectType._id));
            });
        });
    });
};

//exports
module.exports = SortObjects;
