/*
    Copyright (C) 2015  PencilBlue, LLC

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

module.exports = function(pb) {
    
    //pb dependencies
    var util = pb.util;
    
    /**
     *  Deletes an object type
     */
    function DeleteObjectType(){}
    util.inherits(DeleteObjectType, pb.FormController);

    DeleteObjectType.prototype.onPostParamsRetrieved = function(post, cb) {
        var self = this;
        var vars = this.pathVars;

        if(!pb.validation.isIdStr(vars.id, true)) {
            return cb({
                code: 400,
                content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('INVALID_UID'))
            });
        }

        //ensure existence
        var service = new pb.CustomObjectService(self.site, true);
        service.loadTypeById(vars.id, function(err, objectType) {
            if(objectType === null) {
                cb({
                    code: 400,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('INVALID_UID'))
                });
                return;
            }

            service.deleteTypeById(vars.id, function(err, recordsDeleted) {
                if(util.isError(err)) {
                    cb({
                        code: 500,
                        content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_DELETING'))
                    });
                    return;
                }
                cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, objectType.name + ' ' + self.ls.get('DELETED'))});
            });
        });
    };

    //exports
    return DeleteObjectType;
};
