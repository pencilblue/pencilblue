/**
 * Login - Authenticates a user
 * @returns
 */
function Login(){}

//inheritance
util.inherits(Login, pb.BaseController);


Login.prototype.render = function(cb) {
	var self = this;
    this.getPostParams(function(err, post){
    	if (util.isError(err)) {
			//TODO implement error handler
			pb.log.warn("ActinosSetup: Unimplemented error condition!");
			cb({content: 'Implement me!', code: 500});
			return;
		}
    	
    	self.doLogin(post, cb);
    });
    
};

Login.prototype.doLogin = function(post, cb) {
	var self         = this;
    var adminAttempt = this.query['admin_attempt'] ? true : false;
	var userDocument = pb.DocumentCreator.create('user', post);
	
	var query = {
		object_type : 'user',
		$or : [ 
	        {
	        	username : userDocument['username']
	        }, 
	        {
	        	email : userDocument['username']
	        } 
        ],
		password : userDocument['password']
	};
	
	//search for user
	getDBObjectsWithValues(query, function(data) {
		
		//user does not exist
        if(data.length == 0)  {
            self.loginError(adminAttempt, cb);
            return;
        }
        
        //user exists but their credentials are not high enough
        var user = data[0];
        if(adminAttempt && user.admin == ACCESS_USER) {
            self.loginError(adminAttempt, cb);
            return;
        }
        
        //remove password from data to be cached
        delete user.password;
        
        //build out session object
        self.session.authentication.user        = user;
        self.session.authentication.user_id     = user._id.toString();
        self.session.authentication.admin_level = user.admin;
        
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
    this.session.error = '^loc_INVALID_LOGIN^';
    if(adminAttempt){
        this.redirect(pb.config.siteRoot + '/admin/login', cb);
        return;
    }
    
    this.redirect(pb.config.siteRoot + '/user/login', cb);
};

//exports
module.exports = Login;
