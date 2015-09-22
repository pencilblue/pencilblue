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

module.exports = function AuthTokenControllerModule(pb) {

    //dependencies
    var util = pb.util;

    /**
     * Creates authentication token for administrators
     * and managing editors for cross site access
     *
     * @class AuthTokenController
     * @constructor
     * @extends BaseController
     */
    function AuthTokenController() {}
    util.inherits(AuthTokenController, pb.BaseController);

    AuthTokenController.prototype.render = function(cb) {
        var self = this;
        var options = {
            site: this.pathVars.siteid,
            user: this.session.authentication.user_id
        };
        var tokenService = new pb.TokenService(options);
        tokenService.generateUserToken(function(err, tokenInfo) {
            if(pb.util.isError(err)) {
                return cb({
                    code: 500,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.get('ERROR_SAVING'))
                });
            }
            cb({
                code: 200,
                content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, self.ls.get('TOKEN_CREATED'), tokenInfo)
            });
        });
    };

    //exports
    return AuthTokenController;
};