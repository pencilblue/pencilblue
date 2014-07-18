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
 * Deletes an unverified user
 */

function DeleteUnverifiedUser(){}

//inheritance
util.inherits(DeleteUnverifiedUser, pb.BaseController);

DeleteUnverifiedUser.prototype.render = function(cb) {
    var self    = this;
    var vars    = this.pathVars;

    var message = this.hasRequiredParams(vars, ['id']);
    if (message) {
        this.formError(message, '/admin/users/unverified_users', cb);
        return;
    }

    //ensure existence
    var dao = new pb.DAO();
    dao.loadById(vars.id, 'unverified_user', function(err, user) {
        if(user === null) {
            self.formError(self.ls.get('ERROR_SAVING'), '/admin/users/unverified_users', cb);
            return;
        }

        //delete the user
        dao.deleteById(vars.id, 'unverified_user').then(function(result) {
            if(result < 1) {
                self.formError(self.ls.get('ERROR_SAVING'), '/admin/users/unverified_users', cb);
                return;
            }

            self.session.success = user.username + ' ' + self.ls.get('DELETED');
            self.redirect('/admin/users/unverified_users', cb);
        });
    });
};

//exports
module.exports = DeleteUnverifiedUser;
