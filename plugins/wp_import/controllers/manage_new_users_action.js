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

module.exports = function ManageNewWPUsersActionControllerModule(pb) {
    
    //pb dependencies
    var util = pb.util;

    function ManageNewWPUsersActionController() {}
    util.inherits(ManageNewWPUsersActionController, pb.BaseController);

    ManageNewWPUsersActionController.prototype.render = function(cb) {
        var self = this;
        var dao = new pb.DAO();

        this.getJSONPostParams(function(err, post) {
            if(!self.session.importedUsers || !post) {
                cb({
                    code: 400,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, message)
                });
                return;
            }

            var users = self.session.importedUsers;

            self.updateNewUser = function(index) {

                if(index >= post.users.length) {
                    delete self.session.importedUsers;
                    cb({
                        code: 200,
                        content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, self.ls.get('USERS') + ' ' + self.ls.get('SAVED'))
                    });
                    return;
                }

                if(!post.users[index]) {
                    index++;
                    self.updateNewUser(index);
                    return;
                }

                dao.loadByValue('username', post.users[index].username, 'user', function(err, user) {
                    if(!user) {
                        index++;
                        self.updateNewUser(index);
                        return;
                    }

                    delete post.users[index][pb.DAO.getIdField()];
                    pb.DocumentCreator.update(post.users[index], user);
                    dao.save(user, function(err, result) {
                        index++;
                        self.updateNewUser(index);
                    });
                });
            };

            self.updateNewUser(0);
        });
    };

    ManageNewWPUsersActionController.getRoutes = function(cb) {
        var routes = [
            {
                method: 'post',
                path: '/actions/admin/plugins/wp_import/settings/manage_new_users',
                auth_required: true,
                inactive_site_access: true,
                access_level: pb.SecurityService.ACCESS_MANAGING_EDITOR,
                content_type: 'text/html'
            }
        ];
        cb(null, routes);
    };

    //exports
    return ManageNewWPUsersActionController;
};
