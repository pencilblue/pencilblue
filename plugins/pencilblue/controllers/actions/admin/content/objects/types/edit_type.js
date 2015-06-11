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
     * Edits an object type
     * @class EditObjectType
     * @constructor
     * @extends BaseAdminController
     */
    function EditObjectType(){}
    util.inherits(EditObjectType, pb.BaseAdminController);

    EditObjectType.prototype.render = function(cb) {
        var self    = this;
        var vars    = this.pathVars;

        if(!vars.id) {
            return cb({
                code: 400,
                content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('INVALID_UID'))
            });
        }

        var service = new pb.CustomObjectService(self.site, true);
        service.loadTypeById(vars.id, function(err, custObjType) {
            if(util.isError(err) || !util.isObject(custObjType)) {
                return cb({
                    code: 400,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('INVALID_UID'))
                });
            }

            //TODO modify this approach to check for protected properties and allow 
            //others.  Right now this will not allow additional fields if template 
            //is overriden.
            var post = self.body;
            custObjType.name = post.name;
            custObjType.fields = post.fields;
            custObjType.fields.name = {field_type: 'text'};

            service.saveType(custObjType, function(err, result) {
                if(util.isError(err)) {
                    return cb({
                        code: 500,
                        content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_SAVING'))
                    });
                }
                else if(util.isArray(result) && result.length > 0) {
                    return cb({
                        code: 400,
                        content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_SAVING'), result)
                    });
                }

                cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, custObjType.name + ' ' + self.ls.get('EDITED'))});
            });
        });
    };

    //exports
    return EditObjectType;
};
