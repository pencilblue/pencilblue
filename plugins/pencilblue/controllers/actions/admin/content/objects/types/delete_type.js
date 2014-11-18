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
        cb({
            code: 400,
            content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, message)
        });
        return;
    }

    //ensure existence
    var dao = new pb.DAO();
    dao.loadById(vars.id, 'custom_object_type', function(err, objectType) {
        if(objectType === null) {
            cb({
                code: 400,
                content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('INVALID_UID'))
            });
            return;
        }

        dao.deleteById(vars.id, 'custom_object_type').then(function(recordsDeleted) {
            if(recordsDeleted <= 0) {
                cb({
                    code: 500,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_DELETING'))
                });
                return;
            }

            dao.deleteMatching({type: vars.id}, 'custom_object').then(function(recordsDeleted) {
                cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, objectType.name + ' ' + self.ls.get('DELETED'))});
            });
        });
    });
};

//exports
module.exports = DeleteObjectType;
