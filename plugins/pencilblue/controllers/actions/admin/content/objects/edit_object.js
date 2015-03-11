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
util.inherits(EditObject, pb.BaseController);

EditObject.prototype.render = function(cb) {
    var self = this;
    var vars = this.pathVars;

    if(!pb.validation.isIdStr(vars.type_id, true) || !pb.validation.isIdStr(vars.id, true)) {
        cb({
            code: 400,
            content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('INVALID_UID'))
        });
        return;
    }

    var service = new pb.CustomObjectService();
    service.loadById(vars.id, function(err, custObj) {
        if(util.isError(err) || !pb.utils.isObject(custObj)) {
            cb({
                code: 400,
                content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('INVALID_UID'))
            });
            return;
        }

        //load the type definition
        service.loadTypeById(vars.type_id, function(err, custObjType) {
            if(util.isError(err) || !pb.utils.isObject(custObjType)) {
                cb({
                    code: 400,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('INVALID_UID'))
                });
                return
            }

            self.customObjectType = custObjType;

            //format post fields
            var post = self.body;
            pb.CustomObjectService.formatRawForType(post, custObjType);
            pb.utils.deepMerge(post, custObj);

            //validate and persist
            service.save(custObj, custObjType, function(err, result) {
                if(util.isError(err)) {
                    cb({
                        code: 500,
                        content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_SAVING'))
                    });
                    return;
                }
                else if(util.isArray(result) && result.length > 0) {
                    return cb({
                        code: 400,
                        content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_SAVING'), result)
                    });
                }

                cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, custObj.name + ' ' + self.ls.get('EDITED'))});
            });
        });
    });
};

//EditObject.prototype.getSanitizationRules = function() {
//    var sanitizationRules = {};
//    for(var key in self.customObjectType.fields) {
//        if(customObjectType.fields[key].field_type === 'wysiwyg') {
//            sanitizationRules[key] = pb.BaseController.getContentSanitizationRules();
//        }
//    }
//
//    return sanitizationRules;
//};

//exports
module.exports = EditObject;
