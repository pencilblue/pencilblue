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
 * Edits an object type
 * @class EditObjectType
 * @constructor
 * @extends FormController
 */
function EditObjectType(){}

//inheritance
util.inherits(EditObjectType, pb.FormController);

EditObjectType.prototype.onPostParamsRetrieved = function(post, cb) {
	var self    = this;
	var vars    = this.pathVars;

	if(!vars.id) {
	    return this.reqHandler.serve404();
	}

    var service = new pb.CustomObjectService();
    service.loadTypeById(vars.id, function(err, custObjType) {
		if (util.isError(err)) {
            return self.serveError(err);
        }
        else if (!pb.utils.isObject(custObjType)) {
            return self.reqHandler.serve404();
        }

        //format and merge objects
		var objectTypeDocument = pb.CustomObjectService.formatRawType(post, self.ls);
        if(!objectTypeDocument) {
            self.formError(self.ls.get('INVALID_FIELD'), '/admin/content/custom_objects/edit_object_type/' +  vars.id, cb);
            return;
        }
        pb.utils.merge(objectTypeDocument, custObjType);

        service.saveType(custObjType, function(err, result) {
            if (util.isError(err)) {
                return self.serveError(err);
            }
            else if (util.isArray(result) && result.length > 0) {

                self.setFormFieldValues(post);
                self.formError(pb.CustomObjectService.createErrorStr(result), '/admin/content/custom_objects/edit_object_type/' +  vars.id, cb);
                return;
            }

            self.session.success = custObjType.name + ' ' + self.ls.get('EDITED');
            self.redirect('/admin/content/custom_objects/edit_object_type/' +  vars.id, cb);
        });
    });
};

//exports
module.exports = EditObjectType;
