/**
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */

//dependencies
var BaseController = pb.BaseController;
var FormController = pb.FormController;

/**
 * Profile - Edits a user
 *
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
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
        if(util.isError(err) || user == null) {
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
            self.redirect(pb.config.siteRoot + '/user/manage_account', cb);
        });
    });
};

//exports
module.exports = Profile;
