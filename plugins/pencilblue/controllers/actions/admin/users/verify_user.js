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

module.exports = function VerifyUserModule(pb) {

    //pb dependencies
    var util = pb.util;

    /**
     * Verifies a user
     */
    function VerifyUser(){}
    util.inherits(VerifyUser, pb.BaseController);

    VerifyUser.prototype.render = function(cb) {
        var self    = this;
        var vars    = this.pathVars;

        var message = this.hasRequiredParams(vars, ['id']);
        if (message) {
            return cb({
                code: 400,
                content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, message)
            });
        }

        //ensure existence
        var dao = new pb.SiteQueryService({site: self.site, onlyThisSite: true});
        dao.loadById(vars.id, 'unverified_user', function(err, unverifiedUser) {
            if(unverifiedUser === null) {
                return cb({
                    code: 400,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.g('generic.INVALID_UID'))
                });
            }

            dao.deleteById(vars.id, 'unverified_user', function(err, result) {
                // Handle errors
                if (util.isError(err)){
                    pb.log.error("SiteQueryService.deleteById encountered an error. ERROR[%s]", err.stack);
                    return cb({
                        code: 500,
                        content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.g('generic.ERROR_SAVING'))
                    });
                }

                //convert to user
                var user = unverifiedUser;
                delete user[pb.DAO.getIdField()];
                delete user.created;
                delete user.last_modified;
                user.object_type = 'user';

                dao.save(user, function(err, result) {
                    if(util.isError(result))  {
                        return cb({
                            code: 500,
                            content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.g('generic.ERROR_SAVING'))
                        });
                    }

                    cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, user.username + ' ' + self.ls.g('users.VERIFIED'))});
                });
            });
        });
    };

    //exports
    return VerifyUser;
};
