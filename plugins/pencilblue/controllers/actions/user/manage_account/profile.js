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

module.exports = function UserProfileApiControllerModule(pb) {

    //pb dependencies
    var util              = pb.util;
    var BaseApiController = pb.BaseApiController;
    var UserService       = pb.UserService;

    /**
     * Edits the logged in user's information
     * @class UserProfileApiController
     * @constructor
     * @extends BaseApiController
     */
    function UserProfileApiController(){}
    util.inherits(UserProfileApiController, BaseApiController);

    /**
     * Initializes the controller
     * @method init
     * @param {Object} context
     * @param {Function} cb
     */
    UserProfileApiController.prototype.init = function(context, cb) {
        var self = this;
        var init = function(err) {

            /**
             *
             * @property service
             * @type {UserService}
             */
            self.service = new UserService(self.getServiceContext());

            cb(err, true);
        };
        UserProfileApiController.super_.prototype.init.apply(this, [context, init]);
    };

    /**
     * Updates the authenticated user.  This overrides the typical
     * BaseApiController.put so we can force the user changes to only affect
     * the authenticated user.
     * @method put
     * @param {Function} cb
     */
    UserProfileApiController.prototype.put = function(cb) {
        var dto = this.body || {};
        dto[pb.DAO.getIdField()] = this.session.authentication.user_id;
        this.service.save(dto, this.handleSave(cb, false));
    };

    //exports
    return UserProfileApiController;
};
