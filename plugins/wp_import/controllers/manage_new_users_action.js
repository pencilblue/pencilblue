/**
 * ManageNewWPUsers - Saves settings for the display of home page content in the Portfolio theme
 *
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright 2014 PencilBlue, LLC.  All Rights Reserved
 */

function ManageNewWPUsers() {}

//inheritance
util.inherits(ManageNewWPUsers, pb.FormController);

ManageNewWPUsers.prototype.onPostParamsRetrieved = function(post, cb) {
    var self = this;
    var dao = new pb.DAO();

    if(!self.session.importedUsers || !post) {
        self.session.error = self.ls.get('ERROR_SAVING');
        cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/plugins/settings/wp_import/manage_new_users'));
        return;
    }

    var users = self.session.importedUsers;

    this.updateNewUser = function(index) {
        if(index >= users.length) {
            self.session.success = self.ls.get('USERS') + ' ' + self.ls.get('SAVED');
            delete self.session.importedUsers;
            cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/plugins/settings/wp_import'));
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
