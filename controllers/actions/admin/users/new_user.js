/**
 * NewUser - Add a new user
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function NewUser(){}

//inheritance
util.inherits(NewUser, pb.FormController);

NewUser.prototype.onPostParamsRetrieved = function(post, cb) {
	var self = this;
	
	post['photo'] = post['uploaded_image'];
    delete post['uploaded_image'];
    delete post['image_url'];
    
    var message = this.hasRequiredParams(post, this.getRequiredFields());
    if(message) {
        this.formError(message, '/admin/users/new_user', cb);
        return;
    }
    
    if(!pb.security.isAuthorized(this.session, {admin_level: post['admin']})) {
        this.formError('^loc_INSUFFICIENT_CREDENTIALS^', '/admin/users/new_user', cb);
        return;
    }
    
    var user = pb.DocumentCreator.create('user', post);
    pb.users.isUserNameOrEmailTaken(user.username, user.email, post.id, function(err, isTaken) {
        if(util.isError(err) || isTaken) {
            self.formError('^loc_EXISTING_USERNAME^', '/admin/users/new_user', cb);
            return;
        }
        
        var dao = new pb.DAO();
        dao.update(user).then(function(result) {
            if(util.isError(result)) {
                self.formError('^loc_ERROR_SAVING^', '/admin/users/new_user', cb);
                return;
            }
            
            self.session.success = '^loc_USER_CREATED^';
            self.redirect(pb.config.siteRoot + '/admin/users/manage_users', cb);
        });
    });
};

NewUser.prototype.getRequiredFields = function() {
	return ['username', 'email', 'password', 'confirm_password', 'admin'];
};

//exports
module.exports = NewUser;
