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
    
    pb.templates.load('user/manage_account/profile', null, null, function(data) {
        var result = '' + data;
        
        var user = self.session.authentication.user;
        result = result.split('^image_title^').join('^loc_USER_PHOTO^');
        result = result.split('^uploaded_image^').join((user.photo) ? user.photo : '');
        
        self.prepareFormReturns(result, function(newResult) {
            result = newResult;
            
            var content = self.localizationService.localize(['users', 'media'], result);
            cb({content: content});
        });
    });
};

//exports
module.exports = Profile;
