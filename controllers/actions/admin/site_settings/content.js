/**
 * Saves the site's content settings
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function Content(){}

//inheritance
util.inherits(Content, pb.FormController);

Content.prototype.onPostParamsRetrieved = function(post, cb) {
	var self = this;
	
	post = pb.DocumentCreator.formatIntegerItems(post, ['articles_per_page', 'auto_break_articles', 'display_timestamp', 'display_hours_minutes', 'display_bylines', 'display_author_photo', 'display_author_position', 'allow_comments', 'default_comments']);
	self.setFormFieldValues(post);
	
	var message = this.hasRequiredParams(post, ['articles_per_page']);
	if(message) {
        this.formError(message, '/admin/site_settings/content', cb);
        return;
    }
    
    pb.settings.set('content_settings', post, function(data) {
        if(util.isError(data)) {
            self.formError(self.ls.get('ERROR_SAVING'), '/admin/site_settings/content', cb);
            return;
        }
        
        self.session.success = self.ls.get('CONTENT_SETTINGS') + ' ' + self.ls.get('EDITED');
        cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/site_settings/content'));
    });
};

//exports 
module.exports = Content;
