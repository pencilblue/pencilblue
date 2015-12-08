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

module.exports = function ResetPasswordModule(pb) {
    
    //pb dependencies
    var util = pb.util;
    
    /**
     * Resets the logged in user's password
     */
    function ResetPassword(){}
    util.inherits(ResetPassword, pb.BaseController);

    ResetPassword.prototype.render = function(cb) {
        var self = this;
        var get  = this.query;

        if(this.hasRequiredParams(get, ['email', 'code'])) {
            this.formError(self.ls.get('INVALID_VERIFICATION'), '/user/login', cb);
            return;
        }

        var dao = new pb.SiteQueryService({site: self.site, onlyThisSite: true});
        dao.loadByValue('email', get.email, 'user', function(err, user) {
            if(user === null) {
                self.formError(self.ls.get('INVALID_VERIFICATION'), '/user/login', cb);
                return;
            }

            dao.loadByValue('user_id', user[pb.DAO.getIdField()].toString(), 'password_reset', function(err, passwordReset) {
                if(passwordReset === null) {
                    self.formError(self.ls.get('INVALID_VERIFICATION'), '/user/login', cb);
                    return;
                }

                if(get.code !== passwordReset.verification_code) {
                    self.formError(self.ls.get('INVALID_VERIFICATION'), '/user/login', cb);
                    return;
                }

                // delete the password reset token
                dao.deleteById(passwordReset[pb.DAO.getIdField()], 'password_reset', function(err, result)  {
                    //log the user in
                    self.session.authentication.user        = user;
                    self.session.authentication.user_id     = user[pb.DAO.getIdField()].toString();
                    self.session.authentication.admin_level = user.admin;
                    self.session.authentication.reset_password = true;

                    //redirect to change password
                    location = '/user/change_password';
                    self.redirect(location, cb);
                });
            });
        });
    };

    //exports
    return ResetPassword;
};
