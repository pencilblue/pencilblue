/**
 * Saves the site's email settings
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function Email(){}

//inheritance
util.inherits(Email, pb.FormController);

Email.prototype.onPostParamsRetrieved = function(post, cb) {
	var self = this;
	
	delete post['layout_link_url'];
    delete post['media_max_height'];
    
    post = pb.DocumentCreator.formatIntegerItems(post, ['secure_connection', 'port']);
    self.setFormFieldValues(post);
    
    pb.settings.set('email_settings', post, function(data)
    {
        if(util.isError(data)) {
            self.formError('^loc_ERROR_SAVING^', '/admin/site_settings/content', cb);
            return;
        }
        
        self.session.success = '^loc_EMAIL_SETTINGS^ ^loc_EDITED^';
        cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/site_settings/email'));
    });
};

//exports 
module.exports = Email;
