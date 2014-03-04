/**
 * Profile - Edits a user
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function Profile(){}

//inheritance
util.inherits(Profile, pb.FormController);

Profile.prototype.onPostParamsRetrieved = function(post, cb) {
	var self = this;
	
	post['photo'] = post['uploaded_image'];
    
    delete post['uploaded_image'];
    delete post['image_url'];
    
    var dao = new pb.DAO();
    dao.loadById(self.session.authentication.user_id, 'user', function(err, user) {
        if(util.isError(err) || user == null) {
            self.formError('^loc_ERROR_SAVING^', '/user/manage_account', cb);
            return;
        }

        //update the document
        pb.DocumentCreator.update(post, user);
        dao.update(user).then(function(result) {
            if(util.isError(result)) {
                self.formError('^loc_ERROR_SAVING^', '/user/manage_account', cb);
                return;
            }
            
            self.session.authentication.user = user;
            self.session.success = '^loc_PROFILE_EDITED^';
            self.redirect(pb.config.siteRoot + '/user/manage_account', cb);
        });
    });
};

//exports
module.exports = Profile;
