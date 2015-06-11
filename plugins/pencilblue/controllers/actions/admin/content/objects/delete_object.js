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
     * Deletes an object
     */
    function DeleteObject(){}
    util.inherits(DeleteObject, pb.BaseAdminController);

    DeleteObject.prototype.render = function(cb) {
        var self = this;
        var vars = this.pathVars;
        if(!vars.id && vars.type_id) {
            vars.id = vars.type_id;
        }

        var message = this.hasRequiredParams(vars, ['id']);
        if(message) {
            cb({
                code: 400,
                content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, message)
            });
            return;
        }

        var cos = new pb.CustomObjectService(self.site, true);
        cos.loadById(vars.id, function(err, customObject) {
            if (util.isError(err)) {
                return self.reqHandler.serveError(err);
            }
            else if(!customObject) {
                return self.redirect('/admin/content/custom_objects/manage_object_types', cb);
            }

            //remove the object from persistence
            cos.deleteById(vars.id, function(err, recordsDeleted) {
                if(util.isError(err) || recordsDeleted <= 0) {
                    return cb({
                        code: 500,
                        content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_DELETING'))
                    });
                }

                cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, customObject.name + ' ' + self.ls.get('DELETED'))});
            });
        });
    };

    //exports
    return DeleteObject;
};
