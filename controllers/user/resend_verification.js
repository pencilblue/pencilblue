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
        
        self.ts.setPageName(self.ls.get('RESEND_VERIFICATION'));
        self.ts.registerLocal('site_logo', function(flag, cb) {
    		
    		var dao = new pb.DAO();
            dao.query('pencilblue_theme_settings').then(function(data) {
            	var logoPath;
    	        if(data && data.length == 0) {
    	            logoPath = path.join(pb.config.siteRoot, 'img', 'logo_menu.png');
    	        }
    	        else {
    	            logoPath = data[0].site_logo;
    	        }
    	        cb(util.isError(data) ? data : null, logoPath);
            });
    	});
        self.ts.load('user/resend_verification', function(err, data) {
            cb({content: data});
        });
    });
};

//exports
module.exports = ResendVerification;
