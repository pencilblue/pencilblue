/**
 * Login - Authenticates a user
 * @returns
 */
function Login(){}

//dependencies
var FormController     = pb.FormController;
var FormAuthentication = pb.FormAuthentication;

//inheritance
util.inherits(Login, FormController);


Login.prototype.onPostParamsRetrieved = function(post, cb) {
	var self         = this;
    var adminAttempt = this.query['admin_attempt'] ? true : false;
    
    var options = post;
    options.access_level = adminAttempt ? ACCESS_WRITER : ACCESS_USER;
    pb.security.authenticateSession(this.session, options, new FormAuthentication(), function(err, user) {
    	if(util.isError(err) || user == null)  {
            self.loginError(adminAttempt, cb);
            return;
        }
    	
    	//redirect
        var location = pb.config.siteRoot;
        if (self.session.on_login != undefined) {
        	location = self.session.on_login;
        	delete self.session.on_login;
        }
        else if(adminAttempt) {
            location += '/admin';
        }
        cb(pb.RequestHandler.generateRedirect(location));
    });
};

Login.prototype.loginError = function(adminAttempt, cb) {
    this.session.error = this.ls.get('INVALID_LOGIN');
    if(adminAttempt){
        this.redirect(pb.config.siteRoot + '/admin/login', cb);
        return;
    }
    
    this.redirect(pb.config.siteRoot + '/user/login', cb);
};

//exports
module.exports = Login;
