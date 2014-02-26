/**
 * Login - Interface to authenticate a non-admin user
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function Login(){}

//inheritance
util.inherits(Login, pb.BaseController);

Login.prototype.render = function(cb) {
	var self = this;
	
	pb.templates.load('user/login', '^loc_LOGIN^', null, function(data) {
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
            
                var content = self.localizationService.localize(['users', 'login'], result);
                cb({content: content});
            });
        });
    });
};

//exports
module.exports = Login;
