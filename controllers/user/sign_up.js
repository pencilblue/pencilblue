/**
 * SignUp - Interface for signing a user up
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function SignUp(){}

//inheritance
util.inherits(SignUp, pb.BaseController);

SignUp.prototype.render = function(cb) {
	var self = this;
	
	pb.content.getSettings(function(err, contentSettings) {
        if(!contentSettings.allow_comments) {
            self.redirect(pb.config.siteRoot, cb);
            return;
        }   
        
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
        self.ts.load('user/sign_up', function(err, data) {
            cb({content: data});
        });
    });
};

//exports
module.exports = SignUp;
