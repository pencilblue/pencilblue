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
     * Sets the sorting of objects
     * @class SortObjectsActionController
     * @constructor
     */
    function SortObjectsActionController(){}
    util.inherits(SortObjectsActionController, pb.FormController);

    SortObjectsActionController.prototype.render = function(cb) {
        var self = this;
        var vars = this.pathVars;

        if(!pb.validation.isIdStr(vars.type_id, true)) {
            return cb({
                code: 400,
                content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.g('generic.INVALID_UID'))
            });
        }

        var service = new pb.CustomObjectService(self.site, false);
        service.loadTypeById(vars.type_id, function(err, customObjectType) {
            if(util.isError(err) || !util.isObject(customObjectType)) {
                return cb({
                    code: 400,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.g('generic.INVALID_UID'))
                });
            }

            //load the existing ordering if available
            service.loadSortOrdering(customObjectType, function(err, sortOrder) {
                if(util.isError(err)) {
                    return cb({
                        code: 500,
                        content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.g('generic.ERROR_SAVING'))
                    });
                }

                //format raw post
                var post = self.body;
                post.custom_object_type = vars.type_id;
                var sortOrderDoc = pb.CustomObjectService.formatRawSortOrdering(post, sortOrder);

                //persist ordering
                service.saveSortOrdering(sortOrderDoc, function(err, result) {
                    if(util.isError(err)) {
                        return cb({
                            code: 500,
                            content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.g('generic.ERROR_SAVING'))
                        });
                    }
                    else if (util.isArray(result) && result.length > 0) {
                        return cb({
                            code: 500,
                            content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.g('generic.ERROR_SAVING'))
                        });
                    }

                    cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, customObjectType.name + ' ' + self.ls.g('custom_objects.SORT_SAVED'))});
                });
            });
        });
    };

    //exports
    return SortObjectsActionController;
};
