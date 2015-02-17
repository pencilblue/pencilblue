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
    var util           = pb.util;
    var BaseController = pb.BaseController;
    var FormController = pb.FormController;
    
    /**
     * Changes the logged in user's password
     */
    function ChangePassword(){}
    util.inherits(ChangePassword, FormController);

    ChangePassword.prototype.onPostParamsRetrieved = function(post, cb) {
        var self = this;

        //sanitize
        post.current_password = BaseController.sanitize(post.current_password);
        post.new_password     = BaseController.sanitize(post.new_password);
        post.confirm_password = BaseController.sanitize(post.confirm_password);

        //validate
        if(self.session.authentication.reset_password) {
            var message = this.hasRequiredParams(post, ['new_password', 'confirm_password']);
        }
        else {
            var message = this.hasRequiredParams(post, ['current_password', 'new_password', 'confirm_password']);
        }
        if(message) {
            this.formError(message, '/user/change_password', cb);
            return;
        }

        var where = pb.DAO.getIdWhere(self.session.authentication.user[pb.DAO.getIdField()])
        if(!self.session.authentication.reset_password) {
            where.password = pb.security.encrypt(post.current_password);
        }
        delete post.current_password;

        if(post.new_password !== post.confirm_password) {
            self.formError(self.ls.get('PASSWORD_MISMATCH'), '/user/change_password', cb);
            return;
        }

        post.password = post.new_password;
        delete post.new_password;
        delete post.confirm_password;

        var dao = new pb.DAO();
        dao.loadByValues(where, 'user', function(err, user) {
            if(util.isError(err) || user === null) {
                self.formError(self.ls.get('INVALID_PASSWORD'), '/user/change_password', cb);
                return;
            }

            pb.DocumentCreator.update(post, user);
            dao.save(user, function(err, result) {
                if(util.isError(err)) {
                    return self.formError(self.ls.get('ERROR_SAVING'), '/user/change_password', cb);
                }

                self.session.authentication.reset_password = false;
                self.session.success = self.ls.get('PASSWORD_CHANGED');
                self.redirect('/user/change_password', cb);
            });
        });
    };

    //exports
    return ChangePassword;
};
