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
 * Sets the sorting of objects
 * @class SortObjectsPostController
 */
function SortObjectsPostController(){}

//inheritance
util.inherits(SortObjectsPostController, pb.FormController);

SortObjectsPostController.prototype.render = function(cb) {
    var self = this;
    var vars = this.pathVars;

    if(!vars.type_id) {
        cb({
            code: 400,
            content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('INVALID_UID'))
        });
        return this.reqHandler.serve404();
    }

    var service = new pb.CustomObjectService();
    service.loadTypeById(vars.type_id, function(err, customObjectType) {
        if(util.isError(err) || !pb.utils.isObject(customObjectType)) {
            cb({
                code: 400,
                content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('INVALID_UID'))
            });
            return;
        }

        service.loadSortOrdering(customObjectType, function(err, sortOrder) {
            if(util.isError(err)) {
                cb({
                    code: 500,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_SAVING'))
                });
                return;
            }

            self.getJSONPostParams(function(err, post) {
                post.custom_object_type = vars.type_id;
                var sortOrderDoc = pb.DocumentCreator.create('custom_object_sort', post);
                sortOrder = sortOrder || {};
                pb.utils.merge(sortOrderDoc, sortOrder);

                service.saveSortOrdering(sortOrder, function(err, result) {
                    if(util.isError(err)) {
                        cb({
                            code: 500,
                            content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_SAVING'))
                        });
                        return;
                    }
                    else if (util.isArray(result) && result.length > 0) {
                        cb({
                            code: 500,
                            content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_SAVING'))
                        });
                        return;
                    }

                    cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, customObjectType.name + ' ' + self.ls.get('SORT_SAVED'))});
                });
            });
        });
    });
};

//exports
module.exports = SortObjectsPostController;
