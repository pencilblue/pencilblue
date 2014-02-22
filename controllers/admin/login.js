/**
 * Login - Authenticates a non-admin user
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function Login(){}

//inheritance
util.inherits(Login, pb.BaseController);


Login.prototype.render = function(cb) {

    
    if(pb.security.isAuthorized(this.session, {authenticated: true, admin_level: ACCESS_WRITER})) {
        cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin'));
        return;
    }
    else if(pb.security.isAuthenticated(this.session)) {
        cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot));
        return;
    }

    var self = this;
    pb.templates.load('admin/login', 'Login', null, function(data) {

        self.displayErrorOrSuccess(data, function(result) {
        	var content = self.localizationService.localize(['login'], result);
        	cb({content: content});
        });
    });
};

//exports
module.exports = Login;