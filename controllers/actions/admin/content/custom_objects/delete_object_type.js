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
 *  Deletes an object type
 */

function DeleteObjectType(){}

//inheritance
util.inherits(DeleteObjectType, pb.FormController);

DeleteObjectType.prototype.onPostParamsRetrieved = function(post, cb) {
    var self = this;
    var vars = this.pathVars;

    var message = this.hasRequiredParams(vars, ['id']);
    if(message) {
        this.formError(message, '/admin/content/custom_objects/manage_object_types', cb);
        return;
    }

    var dao = new pb.DAO();
    dao.query('custom_object_type', {_id: ObjectID(vars.id)}).then(function(customObjectTypes) {
        if (util.isError(customObjectTypes)) {
            //TODO handle this
        }

        if(customObjectTypes.length === 0)
        {
            self.redirect('/admin/content/custom_objects/manage_object_types', cb);
            return;
        }

        var customObjectType = customObjectTypes[0];

        dao.deleteById(vars.id, 'custom_object_type').then(function(recordsDeleted) {
            if(recordsDeleted <= 0) {
                self.formError(self.ls.get('ERROR_SAVING'), '/admin/content/custom_objects/manage_object_types', cb);
                return;
            }

            dao.deleteMatching({type: vars.id}, 'custom_object').then(function(recordsDeleted) {
                self.session.success = customObjectType.name + ' ' + self.ls.get('DELETED');
                self.redirect('/admin/content/custom_objects/manage_object_types', cb);
            });
        });
    });
};

//exports
module.exports = DeleteObjectType;
