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

module.exports = function TokenLoginControllerModule(pb) {

    //dependencies
    var util = pb.util;

    /**
     * Creates authentication token for administrators
     * and managing editors for cross site access
     *
     * @class TokenLoginController
     * @constructor
     * @extends BaseController
     */
    function TokenLoginController() {}
    util.inherits(TokenLoginController, pb.BaseController);

    TokenLoginController.prototype.render = function(cb) {
        var self = this;
        var options = {
            site: this.site,
            onlyThisSite: false
        };
        var callback = this.query.callback;
        pb.security.authenticateSession(this.session, this.query.token, new pb.TokenAuthentication(options), function(err, user) {

            if(util.isError(err)) {
                return cb({
                    code: 500,
                    content: jsonpResponse(callback, pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.get('ERROR_SAVING')))
                });
            }

            if(!user) {
                return cb({
                    code: 400,
                    content: jsonpResponse(callback, pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.get('INVALID_TOKEN')))
                });
            }

            cb({
                code: 200,
                content: jsonpResponse(callback, pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, self.ls.get('TOKEN_LOGIN_SUCCESSFUL')))
            });
        });
    };

    function jsonpResponse(callback, data) {
        return  callback + '(' + data + ')';
    }

    //exports
    return TokenLoginController;
};