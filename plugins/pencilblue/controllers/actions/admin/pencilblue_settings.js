/**
 * PencilBlueSettings - 
 * 
 * @author Blake Callens <blake.callens@gmail.com>
 * @copyright PencilBlue 2014, All rights reserved
 */
function PencilBlueSettings(){}

//inheritance
util.inherits(PencilBlueSettings, pb.FormController);

PencilBlueSettings.prototype.onPostParamsRetrieved = function(post, cb) {
	var self = this;
	
	 post['site_logo'] = post['uploaded_image'];
     
     delete post['uploaded_image'];
     delete post['media_search'];
     delete post['image_url'];
     
     var message = this.hasRequiredParams(post, ['site_logo']);
     if(message) {
         this.formError(message, '/admin/plugins/themes', cb);
         return;
     }
     
     var dao = new pb.DAO();
     dao.query('pencilblue_theme_settings').then(function(data){
    	 if (util.isError(data)) {
    		 //TODO handle error
    	 }
    	 
    	 var settings = null;
    	 if (data.length > 0) {
    		 settings = data[0];
    		 pb.DocumentCreator.update(post, settings, ['carousel_media']);
    	 }
    	 else {
    		 settings = pb.DocumentCreator.create('pencilblue_theme_settings', post, ['carousel_media']);
    	 }
    	 
    	 dao.update(settings).then(function(result){
    		if (util.isError(result)) {
    			self.formError('^loc_ERROR_SAVING^', '/admin/plugins/themes', cb);
    		}
    		 
    		self.session.success = '^loc_PENCILBLUE_SETTINGS_SAVED^';
    		self.redirect(pb.config.siteRoot + '/admin/plugins/themes', cb);
    	 });
     });
};

//exports
module.exports = PencilBlueSettings;
