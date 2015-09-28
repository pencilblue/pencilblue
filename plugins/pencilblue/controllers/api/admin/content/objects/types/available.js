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
     * Checks to see if the proposed name for a custom object type is available
     */
    function GetObjectTypeNameAvailable(){}
    util.inherits(GetObjectTypeNameAvailable, pb.FormController);

    GetObjectTypeNameAvailable.prototype.render = function(cb) {
        var self = this;
        var get = this.query;

        if(!pb.validation.isNonEmptyStr(get.name, true)) {
            return cb({
                code: 400,
                content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, 'name was not passed')
            });
        }

        var service = new pb.CustomObjectService(self.site, true);
        service.typeExists(get.name, function(err, exists) {
            if (util.isError(err)) {
                return cb({content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, err.stack, false)});
            }

            cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, get.name + ' is ' + (exists ? 'not ' : '') + 'available', !exists)});
        });
    };

    //exports
    return GetObjectTypeNameAvailable;
};
