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
        
        pb.templates.load('user/sign_up', '^loc_SIGN_UP^', null, function(data) {
            var result = '' + data;
            
            var dao = new pb.DAO();
            dao.query('pencilblue_theme_settings').then(function(data) {
                if(data.length == 0) {
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
module.exports = SignUp;
