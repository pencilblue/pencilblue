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

module.exports = function VerifyEmailModule(pb) {
    
    //pb dependencies
    var util = pb.util;
    
    /**
     * Tests the token from a verication email and verifies the user if correct
     */
    function VerifyEmail(){}
    util.inherits(VerifyEmail, pb.BaseController);

    VerifyEmail.prototype.render = function(cb) {
        var self = this;
        var get  = this.query;

        if(this.hasRequiredParams(get, ['email', 'code'])) {
            this.formError(self.ls.get('INVALID_VERIFICATION'), '/user/resend_verification', cb);
            return;
        }

        var dao = new pb.SiteQueryService({site: self.site, onlyThisSite: true});
        dao.count('user', {email: get.email}, function(err, count) {
            if(count > 0) {
                self.formError(self.ls.get('USER_VERIFIED'), '/user/login', cb);
                return;
            }

            dao.loadByValue('email', get.email, 'unverified_user', function(err, unverifiedUser) {
                if(unverifiedUser === null) {
                    self.formError(self.ls.get('NOT_REGISTERED'), '/user/sign_up', cb);
                    return;
                }

                if(unverifiedUser.verification_code != get.code) {
                    self.formError(self.ls.get('INVALID_VERIFICATION'), '/user/resend_verification', cb);
                    return;
                }

                dao.deleteById(unverifiedUser[pb.DAO.getIdField()], 'unverified_user', function(err, result)  {
                    //Handle errors
                    if (util.isError(err)){
                        pb.log.error("SiteQueryService.deleteById encountered an error. ERROR[%s]", err.stack);
                        return;
                    }

                    //convert to user
                    var user = unverifiedUser;
                    delete user[pb.DAO.getIdField()];
                    user.object_type = 'user';

                    dao.save(user, function(err, result) {
                        if(util.isError(err))  {
                            return self.formError(self.ls.get('ERROR_SAVING'), '/user/sign_up', cb);
                        }

                        self.session.success = self.ls.get('EMAIL_VERIFIED');
                        self.redirect('/user/login', cb);
                    });
                });
            });
        });
    };

    //exports
    return VerifyEmail;
};
