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
	
	this.setPageName(this.ls.get('LOGIN'));
	this.ts.registerLocal('site_logo', function(flag, cb) {
		
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
	this.ts.load('user/login', function(err, data) {
        cb({content: data});
    });
};

//exports
module.exports = Login;
