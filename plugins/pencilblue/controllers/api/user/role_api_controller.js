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

    //PB dependencies
    var util = pb.util;
    var BaseObjectService = pb.BaseObjectService;
    var SecurityService = pb.SecurityService;

    /**
     *
     * @class RoleApiController
     * @constructor
     * @extends BaseApiController
     */
    function RoleApiController(){}
    util.inherits(RoleApiController, pb.BaseApiController);

    /**
     * Retrieves the available roles for users
     * @method getAll
     * @param {Function} cb
     */
    RoleApiController.prototype.getAll = function(cb) {
        this.handleGet(cb)(null, BaseObjectService.getPagedResult(SecurityService.SYSTEM_ROLES, SecurityService.SYSTEM_ROLES.length));
    };

    //exports
    return RoleApiController;
};
