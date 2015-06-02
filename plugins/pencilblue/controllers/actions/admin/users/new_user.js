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
     * Creates a new user
     */
    function NewUser(){}
    util.inherits(NewUser, pb.BaseAdminController);

    NewUser.prototype.render = function(cb) {
        var self = this;

        this.getJSONPostParams(function(err, post) {
            var message = self.hasRequiredParams(post, self.getRequiredFields());
            if(message) {
                cb({
                    code: 400,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, message)
                });
                return;
            }

            if(!pb.security.isAuthorized(self.session, {admin_level: post.admin})) {
                cb({
                    code: 400,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('INSUFFICIENT_CREDENTIALS'))
                });
                return;
            }

            post.site = pb.users.determineUserSiteScope(post.admin, self.pathSiteUId);
            if (!post.site) {
                cb({
                    code: 400,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, 'User access level not compatible with site scope')
                });
                return;
            }

            var user = pb.DocumentCreator.create('user', post);
            var userService = new pb.UserService(self.pathSiteUId);
            userService.isUserNameOrEmailTaken(user.username, user.email, post.id, function(err, isTaken) {
                if(util.isError(err) || isTaken) {
                    cb({
                        code: 400,
                        content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('EXISTING_USERNAME'))
                    });
                    return;
                }

                var site = self.pathSiteUId || self.site;
                var sqs = new pb.SiteQueryService(site);
                sqs.save(user, function(err, result) {
                    if(util.isError(err)) {
                        cb({
                            code: 500,
                            content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_SAVING'))
                        });
                        return;
                    }

                    cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, self.ls.get('USER_CREATED'), result)});
                });
            });
        });
    };

    NewUser.prototype.getRequiredFields = function() {
        return ['username', 'email', 'password', 'confirm_password', 'admin'];
    };

    //exports
    return NewUser;
};
