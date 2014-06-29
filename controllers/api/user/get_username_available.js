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
 * Checks to see if the proposed username is available
 */

function UsernameAvailable(){}

//inheritance
util.inherits(UsernameAvailable, pb.BaseController);

UsernameAvailable.prototype.render = function(cb) {
	var get  = this.query;

	var message = this.hasRequiredParams(get, ['username']);
    if(message) {
        cb({content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, 'username missing from request')});
        return;
    }

    pb.users.isUserNameOrEmailTaken(get.username, '', null, function(error, isTaken) {
        if(isTaken) {
            cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, get.username + ' is not available', false)});
            return;
        }

        cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, get.username + ' is available', true)});
    });
};

//exports
module.exports = UsernameAvailable;
