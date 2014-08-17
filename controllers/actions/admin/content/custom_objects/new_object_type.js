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
 * @class NewObjectType
 * @constructor
 * @extends FormController
 */
function NewObjectType(){}

//inheritance
util.inherits(NewObjectType, pb.FormController);

NewObjectType.prototype.onPostParamsRetrieved = function(post, cb) {
	var self    = this;

    custObjType = pb.CustomObjectService.formatRawType(post, this.ls);
    if(!custObjType) {
        self.formError(self.ls.get('INVALID_FIELD'), '/admin/content/custom_objects/new_object_type', cb);
        return;
    }

    var service = new pb.CustomObjectService();
    service.saveType(custObjType, function(err, result) {
        if (util.isError(err)) {
            return self.serveError(err);
        }
        else if (util.isArray(result) && result.length > 0) {

            self.setFormFieldValues(post);
            self.formError(pb.CustomObjectService.createErrorStr(result), '/admin/content/custom_objects/new_object_type', cb);
            return;
        }

        self.session.success = custObjType.name + ' ' + self.ls.get('CREATED');
        self.redirect('/admin/content/custom_objects/new_object_type', cb);
    });
};

//exports
module.exports = NewObjectType;
