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

module.exports = function (pb) {

    //pb dependencies
    var util = pb.util;

    /**
     * @class ManageNewWPUsersActionController
     * @extends BaseController
     * @constructor
     */
    function ManageNewWPUsersActionController() {}
    util.inherits(ManageNewWPUsersActionController, pb.BaseController);

    ManageNewWPUsersActionController.prototype.render = function(cb) {
        var self = this;
        var dao = new pb.DAO();
        var post = this.body;

        if(!self.session.importedUsers || !post) {
            return cb({
                code: 400,
                content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, message)
            });
        }

        self.updateNewUser = function(index) {

            if(index >= post.users.length) {
                delete self.session.importedUsers;
                return cb({
                    content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, self.ls.g('admin.USERS') + ' ' + self.ls.g('admin.SAVED'))
                });
            }

            if(!post.users[index]) {
                index++;
                return self.updateNewUser(index);
            }

            dao.loadByValue('username', post.users[index].username, 'user', function(err, user) {
                if(!user) {
                    index++;
                    return self.updateNewUser(index);
                }

                delete post.users[index][pb.DAO.getIdField()];
                pb.DocumentCreator.update(post.users[index], user);
                dao.save(user, function(/*err, result*/) {
                    index++;
                    self.updateNewUser(index);
                });
            });
        };

        self.updateNewUser(0);
    };

    ManageNewWPUsersActionController.getRoutes = function(cb) {
        var routes = [
            {
                method: 'post',
                path: '/actions/admin/plugins/wp_import/settings/manage_new_users',
                auth_required: true,
                inactive_site_access: true,
                access_level: pb.SecurityService.ACCESS_MANAGING_EDITOR,
                content_type: 'text/html',
                request_body: ['application/json']
            }
        ];
        cb(null, routes);
    };

    //exports
    return ManageNewWPUsersActionController;
};
