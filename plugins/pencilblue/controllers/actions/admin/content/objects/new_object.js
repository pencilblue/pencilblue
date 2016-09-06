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

module.exports = function(pb) {

    //pb dependencies
    var util = pb.util;

    /**
     * Creates an object
     * @class NewObjectActionController
     * @constructor
     * @extends BaseAdminController
     */
    function NewObjectActionController(){}
    util.inherits(NewObjectActionController, pb.BaseAdminController);

    NewObjectActionController.prototype.render = function(cb) {
        var self = this;
        var vars = this.pathVars;

        if(!vars.type_id) {
            cb({
                code: 400,
                content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.g('generic.INVALID_UID'))
            });
            return
        }

        var service = new pb.CustomObjectService(self.site, false);
        service.loadTypeById(vars.type_id, function(err, customObjectType) {
            if(util.isError(err) || !util.isObject(customObjectType)) {
                return cb({
                    code: 400,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.g('generic.INVALID_UID'))
                });
            }

            self.customObjectType = customObjectType;

            //format the incoming object
            var post = self.body;
            pb.CustomObjectService.formatRawForType(post, customObjectType);
            var customObjectDocument = pb.DocumentCreator.create('custom_object', post);

            //validate and persist the object
            service.save(customObjectDocument, customObjectType, function(err, result) {
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

                cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, customObjectDocument.name + ' ' + self.ls.g('admin.CREATED'), result)});
            });
        });
    };

    //exports
    return NewObjectActionController;
};
