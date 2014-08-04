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
 * Interface for creating a new READER level user
 */

function SignUp(){}

//inheritance
util.inherits(SignUp, pb.BaseController);

SignUp.prototype.render = function(cb) {
	var self = this;

	pb.content.getSettings(function(err, contentSettings) {
        if(!contentSettings.allow_comments) {
            self.redirect('/', cb);
            return;
        }

        self.ts.load('user/sign_up', function(err, data) {
            cb({content: self.ls.localize([], data)});
        });
    });
};

//exports
module.exports = SignUp;
