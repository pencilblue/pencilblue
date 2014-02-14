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
    
    post = {key: 'email_settings', value: post};
    
    var dao = new pb.DAO();
    dao.query('setting', {key: 'email_settings'}, pb.DAO.PROJECT_ALL).then(function(data) {
        if(data.length > 0) {
            var settings = data[0];
            
            pb.DocumentCreator.update(post, settings);
            
            dao.update(settings).then(function(data) {
                if(util.isError(data)) {
                    self.formError('^loc_ERROR_SAVING^', '/admin/site_settings/email', cb);
                    return;
                }
                
                self.session.success = '^loc_CONTENT_SETTINGS^ ^loc_EDITED^';
                cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/site_settings/email'));
            });
            return;
        }
        
        var settingsDocument = pb.DocumentCreator.create('settings', post);
        dao.update(settingsDocument).then(function(result) {
            if(util.isError(result)) {
                self.formError('^loc_ERROR_SAVING^', '/admin/site_settings/email', cb);
                return;
            }
            
            self.session.success = '^loc_CONTENT_SETTINGS^ ^loc_CREATED^';
            cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/site_settings/email'));
        });
    });
}

//exports 
module.exports = Email;
