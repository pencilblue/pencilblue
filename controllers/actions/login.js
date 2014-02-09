function Login(){}

Login.init = function(request, output)
{
    getSession(request, function(session)
    {
        var get = getQueryParameters(request);
        var post = getPostParameters(request);
        var adminAttempt = (get['admin_attempt']) ? true : false;
        
        var userDocument = createDocument('user', post);        
        
        getDBObjectsWithValues({object_type: 'user', $or: [{username: userDocument['username']}, {email: userDocument['username']}], password: userDocument['password']}, function(data)
        {
            if(data.length == 0)
            {
                Login.loginError(request, session, adminAttempt, output);
                return;
            }
            
            if(adminAttempt && data[0].admin == 0)
            {
                Login.loginError(request, session, adminAttempt, output);
                return;
            }
            
            delete data[0].password;
            session.user = data[0];
            editSession(request, session, [], function(data)
            {
                if(adminAttempt)
                {
                    output({redirect: pb.config.siteRoot + '/admin'});
                }
                else
                {
                    output({redirect: pb.config.siteRoot});
                }
            });
        });
    });
};

Login.loginError = function(request, session, adminAttempt, output)
{
    session.error = '^loc_INVALID_LOGIN^';
    editSession(request, session, [], function(data)
    {
        if(adminAttempt)
        {
            output({redirect: pb.config.siteRoot + '/admin/login'});
            return;
        }
        
        output({redirect: pb.config.siteRoot + '/login'});
    });
};



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
        var location = pb.config.siteRoot;console.log('S:'+JSON.stringify(self.session));
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
        cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/login'));
        return;
    }
    
    cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/login'));
};

//exports
module.exports = Login;
