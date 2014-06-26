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

    this.setPageName(' ' + this.ls.get('LOGIN'));
    this.templateService.load('admin/login',  function(err, data) {
    	cb({content: data});
    });
};

//exports
module.exports = Login;
