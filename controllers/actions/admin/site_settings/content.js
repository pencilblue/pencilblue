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
    
    post = {key: 'content_settings', value: post}

    var dao = new pb.DAO();
    dao.query('setting', {key: 'content_settings'}, pb.DAO.PROJECT_ALL).then(function(data) {
        if(data.length > 0) {
            var settings = data[0];
            
            pb.DocumentCreator.update(post, settings);
            
            dao.update(settings).then(function(data) {
                if(util.isError(data)) {
                    self.formError('^loc_ERROR_SAVING^', '/admin/site_settings/content', cb);
                    return;
                }
                
                self.session.success = '^loc_CONTENT_SETTINGS^ ^loc_EDITED^';
                cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/site_settings/content'));
            });
            return;
        }
        
        var settingsDocument = pb.DocumentCreator.create('settings', post);
        dao.update(settingsDocument).then(function(result) {
            if(util.isError(result)) {
                self.formError('^loc_ERROR_SAVING^', '/admin/site_settings/content', cb);
                return;
            }
            
            self.session.success = '^loc_CONTENT_SETTINGS^ ^loc_CREATED^';
            cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/site_settings/content'));
        });
    });
};

//exports 
module.exports = Content;
