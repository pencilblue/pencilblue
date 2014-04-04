/**
 * Profile - UI for displaying user profile
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function Profile(){}

//inheritance
util.inherits(Profile, pb.FormController);

Profile.prototype.render = function(cb) {
	var self = this;
	
	this.setFormFieldValues(this.session.authentication.user);
    this.session.account_subsection = 'profile';
    
    var user = this.session.authentication.user;
    this.ts.registerLocal('image_title', this.ls.get('USER_PHOTO'));
    this.ts.registerLocal('uploaded_image', user.photo ? user.photo : '');
    this.ts.load('user/manage_account/profile', function(err, data) {
        var result = '' + data;
        
        self.checkForFormRefill(result, function(newResult) {
            cb({content: newResult});
        });
    });
};

//exports
module.exports = Profile;
