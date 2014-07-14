/*
    Copyright (C) 2014  PencilBlue, LLC

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

function ManageNewWPUsers() {}

//inheritance
util.inherits(ManageNewWPUsers, pb.FormController);

ManageNewWPUsers.prototype.onPostParamsRetrieved = function(post, cb) {
    var self = this;
    var dao = new pb.DAO();

    if(!self.session.importedUsers || !post) {
        self.session.error = self.ls.get('ERROR_SAVING');
        this.redirect('/admin/plugins/settings/wp_import/manage_new_users', cb);
        return;
    }

    var users = self.session.importedUsers;

    this.updateNewUser = function(index) {
        if(index >= users.length) {
            self.session.success = self.ls.get('USERS') + ' ' + self.ls.get('SAVED');
            delete self.session.importedUsers;
            self.redirect('/admin/plugins/settings/wp_import', cb);
            return;
        }

        if(!users[index]) {
            index++;
            self.updateNewUser(index);
            return;
        }

        dao.loadByValue('username', users[index].username, 'user', function(err, user) {
            if(!user) {
                index++;
                self.updateNewUser(index);
                return;
            }

            var userUpdates = {
                first_name: post['first_name_' + user.username],
                last_name: post['last_name_' + user.username],
                position: post['position_' + user.username],
                admin: post['admin_' + user.username],
                password: post['password_' + user.username]
            };

            pb.DocumentCreator.update(userUpdates, user);
            dao.update(user).then(function(result) {
                index++;
                self.updateNewUser(index);
            });
        });
    };

    self.updateNewUser(0);
};

ManageNewWPUsers.getRoutes = function(cb) {
    var routes = [
        {
            method: 'post',
            path: '/actions/admin/plugins/settings/wp_import/manage_new_users',
            auth_required: true,
            access_level: ACCESS_MANAGING_EDITOR,
            content_type: 'text/html'
        }
    ];
    cb(null, routes);
};

//exports
module.exports = ManageNewWPUsers;
