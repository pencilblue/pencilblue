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

    //PB dependencies
    var util              = pb.util;
    var AdminNavigation   = pb.AdminNavigation;
    var BaseApiController = pb.BaseApiController;
    var BaseObjectService = pb.BaseObjectService;
    var NavigationItemService = pb.NavigationItemService;

    /**
     *
     * @class NavigationMapApiController
     * @constructor
     * @extends BaseApiController
     */
    function NavigationItemApiController(){}
    util.inherits(NavigationItemApiController, BaseApiController);

    /**
     * Initializes the controller
     * @param {Object} context see BaseController.init
     */
    NavigationItemApiController.prototype.initSync = function(context) {
        this.service = new NavigationItemService(this.getServiceContext(context));
    };

    //exports
    return NavigationItemApiController;
};
