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

    //PB dependencies
    var util              = pb.util;
    var AdminNavigation   = pb.AdminNavigation;
    var BaseApiController = pb.BaseApiController;
    var BaseObjectService = pb.BaseObjectService;

    /**
     *
     * @class NavigationMapApiController
     * @constructor
     * @extends BaseApiController
     */
    function NavigationMapApiController(){}
    util.inherits(NavigationMapApiController, BaseApiController);

    /**
     * Retrieves the admin navigation for the authenticated party
     * @method getAdminMap
     * @param {Function} cb
     */
    NavigationMapApiController.prototype.getAdminMap = function(cb) {
        var activeItems = this.query.activeItems ? this.query.activeItems.split(BaseApiController.MULTI_DELIMITER) : [];
        var map = AdminNavigation.get(this.session, activeItems, this.ls, this.site);
        var wrapper = BaseObjectService.getPagedResult(map, map.length);
        this.handleGet(cb)(null, wrapper);
    };

    //exports
    return NavigationMapApiController;
};
