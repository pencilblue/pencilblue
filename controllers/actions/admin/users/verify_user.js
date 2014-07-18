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
        this.formError(message, '/admin/users/unverified_users', cb);
        return;
    }

    //ensure existence
    var dao = new pb.DAO();
    dao.loadById(vars.id, 'unverified_user', function(err, unverifiedUser) {
        if(unverifiedUser === null) {
            self.formError(self.ls.get('ERROR_SAVING'), '/admin/users/unverified_users', cb);
            return;
        }

        dao.deleteById(vars.id, 'unverified_user').then(function(result)  {
            //TODO handle error

            //convert to user
            var user = unverifiedUser;
            delete user._id;
            delete user.created;
            delete user.last_modified;
            user.object_type = 'user';

            dao.update(user).then(function(result) {
                if(util.isError(result))  {
                    self.formError(self.ls.get('ERROR_SAVING'), '/admin/users/unverified_users', cb);
                    return;
                }

                self.session.success = user.username + ' ' + self.ls.get('VERIFIED');
                self.redirect('/admin/users/unverified_users', cb);
            });
        });
    });
};

//exports
module.exports = VerifyUser;
