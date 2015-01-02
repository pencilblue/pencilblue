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
 * Changes a user's password
 */

function ChangePassword(){}

//inheritance
util.inherits(ChangePassword, pb.BaseController);

ChangePassword.prototype.render = function(cb) {
	var self = this;
	var vars = this.pathVars;

	this.getJSONPostParams(function(err, post) {
	    var message = self.hasRequiredParams(post, self.getRequiredFields());
	    if(message) {
	        cb({
				code: 400,
				content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, message)
			});
	        return;
	    }

	    if(self.session.authentication.user_id != vars.id) {
	        cb({
				code: 400,
				content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('INSUFFICIENT_CREDENTIALS'))
			});
	        return;
	    }

	    if(post.new_password != post.confirm_password) {
			cb({
				code: 400,
				content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('PASSWORD_MISMATCH'))
			});
	        return;
	    }

	    var dao = new pb.DAO();
	    dao.loadById(vars.id, 'user', function(err, user) {
	        if(util.isError(err) || user === null) {
	            cb({
					code: 400,
					content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('INVALID_UID'))
				});
	            return;
	        }

	        pb.DocumentCreator.update(post, user);

	        if(user.password != user.current_password) {
				cb({
					code: 400,
					content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('INVALID_PASSWORD'))
				});
	            return;
	        }

	        user.password = user.new_password;
	        delete user.new_password;
	        delete user.current_password;

	        dao.save(user, function(err, result) {
	            if(util.isError(err)) {
	                return cb({
						code: 500,
						content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_SAVING'))
					});
	            }

				cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, self.ls.get('PASSWORD_CHANGED'))});
	        });
	    });
	});
};

ChangePassword.prototype.getRequiredFields = function() {
	return ['current_password', 'new_password', 'confirm_password'];
};

//exports
module.exports = ChangePassword;
