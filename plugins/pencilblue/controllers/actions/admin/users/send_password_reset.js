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

module.exports = function(pb) {

    //pb dependencies
    var util = pb.util;
    var DAO = pb.DAO;
    var UserService = pb.UserService;

    /**
     * Sends a password reset email
     */
    function SendPasswordReset(){}
    util.inherits(SendPasswordReset, pb.FormController);

    /**
     * Initializes the controller
     * @method init
     * @param {Object} context
     * @param {Function} cb
     */
    SendPasswordReset.prototype.init = function(context, cb) {
        var self = this;
        var init = function(err) {

            /**
             * @property service
             * @type {UserService}
             */
            self.service = new UserService(self.getServiceContext());

            /**
             * @property dao
             * @type {DAO}
             */
            self.dao = new DAO();

            cb(err, true);
        };
        SendPasswordReset.super_.prototype.init.apply(this, [context, init]);
    };

    SendPasswordReset.prototype.onPostParamsRetrieved = function(post, cb) {
        var self = this;
        var vars = this.pathVars;

        var message = this.hasRequiredParams(vars, ['id']);
        if(message) {
            self.formError(message, '/admin/users', cb);
            return;
        }

        //find the user
        this.service.get(vars.id, function(err, user) {
            if(util.isError(err) || user === null) {
                return self.formError(self.ls.g('generic.ERROR_SAVING'), '/admin/users', cb);
            }

            //check to see if a reset value already exists
            self.dao.loadByValue('user_id', vars.id, 'password_reset', function(err, passwordReset) {
                if(util.isError(err)) {
                    return self.formError(self.ls.g('users.NOT_REGISTERED'), '/admin/users/' + vars.id, cb);
                }

                if(!passwordReset) {
                    passwordReset = pb.DocumentCreator.create('password_reset', {user_id: user[pb.DAO.getIdField()].toString()});
                }

                passwordReset.verification_code = util.uniqueId();

                self.dao.save(passwordReset, function(err, result) {
                    if(util.isError(err)) {
                        return self.formError(self.ls.g('generic.ERROR_SAVING'), '/admin/users/' + vars.id, cb);
                    }

                    //send the user an email
                    self.service.sendPasswordResetEmail(user, passwordReset, function(err, response) {
                        if (util.isError(err)) {
                            return self.formError(self.ls.g(err.message), '/admin/users/' + vars.id, cb);
                        }

                        self.session.success = self.ls.g('users.VERIFICATION_SENT') + ' ' + user.email;
                        self.redirect('/admin/users/' + vars.id, cb);
                    });
                });
            });
        });
    };

    //exports
    return SendPasswordReset;
};
