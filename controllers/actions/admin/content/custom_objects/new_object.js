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
 * @class NewObject
 * @constructor
 * @extends FormController
 */
function NewObject(){}

//inheritance
util.inherits(NewObject, pb.FormController);

NewObject.prototype.onPostParamsRetrieved = function(post, cb) {
	var self = this;
	var vars = this.pathVars;

	if(!vars.type_id) {
        return this.serve404();
	}

    var service = new pb.CustomObjectService();
    service.loadTypeById(vars.type_id, function(err, customObjectType) {
		if (util.isError(err)) {
			return self.serveError(err);
		}
        else if (!pb.utils.isObject(customObjectType)) {
            return self.serve404();
        }

		//format post object
        var customObjectDocument = pb.DocumentCreator.create('custom_object', post);
        pb.CustomObjectService.formatRawForType(customObjectDocument, customObjectType);

        service.save(customObjectDocument, customObjectType, function(err, result) {
            if (util.isError(err)) {
                return self.serveError(err);
            }
            else if (util.isArray(result) && result.length > 0) {

                self.setFormFieldValues(post);
		        self.formError(pb.CustomObjectService.createErrorStr(result), '/admin/content/custom_objects/new_object/' + customObjectType[pb.DAO.getIdField()], cb);
                return;
            }

            self.session.success = customObjectDocument.name + ' ' + self.ls.get('CREATED');
            self.redirect('/admin/content/custom_objects/new_object/' + customObjectType[pb.DAO.getIdField()], cb);
        });
    });
};

//exports
module.exports = NewObject;
