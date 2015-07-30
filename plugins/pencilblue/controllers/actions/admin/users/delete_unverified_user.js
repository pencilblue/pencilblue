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
     * Deletes an unverified user
     */
    function DeleteUnverifiedUser(){}
    util.inherits(DeleteUnverifiedUser, pb.BaseController);

    DeleteUnverifiedUser.prototype.render = function(cb) {
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
        var dao = new pb.SiteQueryService({site: self.site, onlyThisSite: true});
        dao.loadById(vars.id, 'unverified_user', function(err, user) {
            if(user === null) {
                cb({
                    code: 400,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('INVALID_UID'))
                });
                return;
            }

            //delete the user
            dao.deleteById(vars.id, 'unverified_user', function(err, result) {
                if(util.isError(err) || result < 1) {
                    cb({
                        code: 500,
                        content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_DELETING'))
                    });
                    return;
                }

                cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, user.username + ' ' + self.ls.get('DELETED'))});
            });
        });
    };

    //exports
    return DeleteUnverifiedUser;
};
