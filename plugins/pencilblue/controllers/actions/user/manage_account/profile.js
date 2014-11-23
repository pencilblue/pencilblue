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
 * Edits the logged in user's information
 */


//dependencies
var BaseController = pb.BaseController;
var FormController = pb.FormController;

function Profile(){}

//inheritance
util.inherits(Profile, FormController);

Profile.prototype.onPostParamsRetrieved = function(post, cb) {
	var self = this;

	post.photo = post.uploaded_image;
    delete post.uploaded_image;
    delete post.image_url;

    //sanitize
    post.email      = BaseController.sanitize(post.email);
    post.username   = BaseController.sanitize(post.username);
    post.first_name = BaseController.sanitize(post.first_name);
    post.last_name  = BaseController.sanitize(post.last_name);
    post.position   = BaseController.sanitize(post.position);
    post.photo      = BaseController.sanitize(post.photo);

    var dao = new pb.DAO();
    dao.loadById(self.session.authentication.user_id, 'user', function(err, user) {
        if(util.isError(err) || user === null) {
            self.formError(self.ls.get('ERROR_SAVING'), '/user/manage_account', cb);
            return;
        }

        //update the document
        pb.DocumentCreator.update(post, user);
        dao.update(user).then(function(result) {
            if(util.isError(result)) {
                self.formError(self.ls.get('ERROR_SAVING'), '/user/manage_account', cb);
                return;
            }

            self.session.authentication.user = user;
            self.session.success = self.ls.get('ACCOUNT') + ' ' + self.ls.get('EDITED');
            self.redirect('/user/manage_account', cb);
        });
    });
};

//exports
module.exports = Profile;
