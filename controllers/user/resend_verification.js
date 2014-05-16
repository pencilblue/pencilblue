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
        self.ts.load('user/resend_verification', function(err, data) {
            cb({content: data});
        });
    });
};

//exports
module.exports = ResendVerification;
