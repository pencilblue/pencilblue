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
    var util              = pb.util;
    var UserService       = pb.UserService;
    var BaseApiController = pb.BaseApiController;

    /**
     * Edits a user
     * @class EditUser
     * @constructor
     * @extends
     */
    function EditUser(){}
    util.inherits(EditUser, BaseApiController);

    /**
     * Initializes the controller
     * @method init
     * @param {Object} context
     */
    EditUser.prototype.initSync = function(context) {

        /**
         *
         * @property service
         * @type {UserService}
         */
        this.service = new UserService(this.getServiceContext());
    };

    /**
     * @method render
     * @param {Function} cb
     */
    EditUser.prototype.render = function(cb) {
        var self = this;
        var vars = this.pathVars;
        var post = this.body || {};


        if(!pb.security.isAuthorized(self.session, {admin_level: post.admin})) {
            return cb({
                code: 400,
                content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.g('generic.INSUFFICIENT_CREDENTIALS'))
            });
        }

        self.service.save(post, function(err, obj) {
            if (util.isError(err)) {
                return cb(err);
            }

            //set the locale for the session the user being modified is the
            //authenticated user
            if (self.session.authentication.user_id === vars.id) {
                self.session.locale = obj.locale;
            }

            cb({
                content: {
                    data: obj
                },
                code: 201
            });
        });
    };

    EditUser.prototype.getRequiredFields = function() {
        return ['username', 'email', 'admin'];
    };

    //exports
    return EditUser;
};
