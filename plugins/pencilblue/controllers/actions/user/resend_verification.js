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


module.exports = function ResendVerificationModule(pb) {
  //pb dependencies
  var util = pb.util;

  /**
   * Resends an account verification email
   */
  function ResendVerification(){}
  util.inherits(ResendVerification, pb.FormController);

  ResendVerification.prototype.render = function(cb) {
    var self = this;

    this.getJSONPostParams(function(err, post) {
      var message = self.hasRequiredParams(post, self.getRequiredFields());
      if(message) {
        cb({
          code: 400,
          content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, message)
        });
        return;
      }

      var dao = new pb.DAO();
      dao.loadByValue('email', post.email, 'user', function(err, user) {
        if(util.isError(err)) {
          cb({
            code: 400,
            content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('NOT_REGISTERED'))
          });
          return;
        }
        else if (!util.isNullOrUndefined(user)) {
          cb({
            code: 400,
            content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('USER_VERIFIED'))
          });
          return;
        }

        dao.loadByValue('email', post.email, 'unverified_user', function(err, user) {
          if(util.isError(err)) {
            cb({
              code: 400,
              content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('NOT_REGISTERED'))
            });
            return;
          }
          else if(util.isNullOrUndefined(user)) {
            cb({
              code: 400,
              content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('NOT_REGISTERED'))
            });
            return;
          }

          user.verification_code = util.uniqueId();

          dao.save(user, function(err, result) {
            if(util.isError(result)) {
              cb({
                code: 500,
                content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_SAVING'))
              });
              return;
            }

            cb({
              content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, self.ls.get('VERIFICATION_SENT') + user.email)
            });
            pb.users.sendVerificationEmail(user, util.cb);
          });
        });
      });
    });
  };

  ResendVerification.prototype.getRequiredFields = function() {
    return ['email'];
  };

  //exports
  return ResendVerification;
};
