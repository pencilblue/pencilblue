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

/**
 * Verifies a user
 */

function VerifyUser(){}

//inheritance
util.inherits(VerifyUser, pb.BaseController);

VerifyUser.prototype.render = function(cb) {
    var self    = this;
    var vars    = this.pathVars;

    var message = this.hasRequiredParams(vars, ['id']);
    if (message) {
        cb({
            code: 400,
            content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, message)
        });
        return;
    }

    //ensure existence
    var dao = new pb.DAO();
    dao.loadById(vars.id, 'unverified_user', function(err, unverifiedUser) {
        if(unverifiedUser === null) {
            cb({
                code: 400,
                content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('INVALID_UID'))
            });
            return;
        }

        dao.deleteById(vars.id, 'unverified_user', function(err, result)  {
            //TODO handle error

            //convert to user
            var user = unverifiedUser;
            delete user[pb.DAO.getIdField()];
            delete user.created;
            delete user.last_modified;
            user.object_type = 'user';

            dao.save(user, function(err, result) {
                if(util.isError(result))  {
                    cb({
                        code: 500,
                        content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_SAVING'))
                    });
                    return;
                }

                cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, user.username + ' ' + self.ls.get('VERIFIED'))});
            });
        });
    });
};

//exports
module.exports = VerifyUser;
