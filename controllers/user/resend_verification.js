/**
 * ResendVerification - Form for resending a verification email
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function ResendVerification(){}

//inheritance
util.inherits(ResendVerification, pb.BaseController);

ResendVerification.prototype.render = function(cb) {
	var self = this;
	
	pb.content.getSettings(function(err, contentSettings) {

        if(!contentSettings.allow_comments || !contentSettings.require_verification) {
            self.redirect(pb.config.siteRoot, cb);
            return;
        }   
        
        pb.templates.load('user/resend_verification', '^loc_RESEND_VERIFICATION^', null, function(data) {
            var result = '' + data;
            
            var dao = new pb.DAO();
            dao.query('pencilblue_theme_settings'),then(function(data) {
                if(util.isError(data) || data.length == 0) {
                    result = result.split('^site_logo^').join(pb.config.siteRoot + '/img/logo_menu.png');
                }
                else {
                    result = result.split('^site_logo^').join(data[0].site_logo);
                }
            
                self.displayErrorOrSuccess(result, function(newResult) {
                    result = newResult;
                    
                    var content = self.localizationService.localize(['users'], result);
                     cb({content: content});
                });
            });
        });
    });
};

//exports
module.exports = ResendVerification;
