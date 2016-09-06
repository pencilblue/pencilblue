/*
    Copyright (C) 2016  PencilBlue, LLC

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
'use strict';

module.exports = function(pb) {

    //pb dependencies
    var util = pb.util;

    /**
     * Edits an object
     * @class EditObject
     * @constructor
     * @extends BaseAdminController
     */
    function EditObject(){}
    util.inherits(EditObject, pb.BaseAdminController);

    EditObject.prototype.render = function(cb) {
        var self = this;
        var vars = this.pathVars;

        if(!pb.validation.isIdStr(vars.type_id, true) || !pb.validation.isIdStr(vars.id, true)) {
            cb({
                code: 400,
                content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.g('generic.INVALID_UID'))
            });
            return;
        }

        var service = new pb.CustomObjectService(self.site, false);
        service.loadById(vars.id, function(err, custObj) {
            if (util.isError(err)) {
                return cb(err);
            }
            else if(!util.isObject(custObj)) {
                return cb({
                    code: 400,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.g('generic.INVALID_UID'))
                });
            }

            //load the type definition
            service.loadTypeById(vars.type_id, function(err, custObjType) {
                if (util.isError(err)) {
                    return cb(err);
                }
                else if(!util.isObject(custObjType)) {
                    return cb({
                        code: 400,
                        content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.g('generic.INVALID_UID'))
                    });
                }

                self.customObjectType = custObjType;

                //format post fields
                var post = self.body;
                pb.CustomObjectService.formatRawForType(post, custObjType);

                //merge the new fields into the existing object
                var fields = Object.keys(custObjType.fields);
                fields.forEach(function(fieldName) {
                    custObj[fieldName] = post[fieldName];
                });

                //validate and persist
                service.save(custObj, custObjType, function(err, result) {
                    if(util.isError(err)) {
                        return cb({
                            code: 500,
                            content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.g('generic.ERROR_SAVING'))
                        });
                    }
                    else if(util.isArray(result) && result.length > 0) {
                        return cb({
                            code: 400,
                            content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.g('generic.ERROR_SAVING'), result)
                        });
                    }

                    cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, custObj.name + ' ' + self.ls.g('admin.EDITED'))});
                });
            });
        });
    };

    //exports
    return EditObject;
};
