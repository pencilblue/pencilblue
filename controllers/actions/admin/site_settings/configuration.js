/**
 * Saves the site's preference to call home
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function ConfigurationSettingsPostController(){}

//inheritance
util.inherits(ConfigurationSettingsPostController, pb.FormController);

ConfigurationSettingsPostController.prototype.onPostParamsRetrieved = function(post, cb) {
	var self = this;
    
    var callHome = post.call_home == 1;
    pb.settings.set('call_home', callHome, function(data) {
        if(util.isError(data)) {
            self.formError(self.ls.get('ERROR_SAVING'), '/admin/site_settings/configuration', cb);
            return;
        }
        
        self.session.success = self.ls.get('CONFIGURATION_SETTINGS') + ' ' +  self.ls.get('EDITED');
        self.redirect('/admin/site_settings/configuration', cb);
    });
};

//exports 
module.exports = ConfigurationSettingsPostController;
