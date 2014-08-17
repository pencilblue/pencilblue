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
 * @class EditObject
 * @constructor
 * @extends FormController
 */
function EditObject(){}

//inheritance
util.inherits(EditObject, pb.FormController);

EditObject.prototype.onPostParamsRetrieved = function(post, cb) {
	var self = this;
	var vars = this.pathVars;

	if(!vars.id) {
        return this.serve404();
	}

    var service = new pb.CustomObjectService();
    service.loadById(vars.id, function(err, custObj) {
		if (util.isError(err)) {
			return self.serveError(err);
		}
        else if (!pb.utils.isObject(custObj)) {
            return self.serve404();
        }

        //load the type definition
        service.loadTypeById(custObj.type, function(err, custObjType) {
            if (util.isError(err)) {
                return self.serveError(err);
            }
            else if (!pb.utils.isObject(custObjType)) {
                return self.serveError(new Error('The custom object type specified for the persisted custom object was invalid'));
            }

            //format post fields
            pb.CustomObjectService.formatRawForType(post, custObjType);
            pb.utils.merge(post, custObj);

            //validate and persist
	        service.save(custObj, custObjType, function(err, result) {
                if (util.isError(err)) {
                    return self.serveError(err);
                }
                else if (util.isArray(result) && result.length > 0) {

                    self.setFormFieldValues(post);
                    self.formError(pb.CustomObjectService.createErrorStr(result), '/admin/content/custom_objects/edit_object/' + custObj[pb.DAO.getIdField()], cb);
                    return;
                }

                self.session.success = custObj.name + ' ' + self.ls.get('EDITED');
                self.redirect('/admin/content/custom_objects/edit_object/' + custObj[pb.DAO.getIdField()], cb);
            });
        });
    });
};

//exports
module.exports = EditObject;
