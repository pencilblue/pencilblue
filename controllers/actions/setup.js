/**
 * 
 * @copyright PencilBlue, LLC 2014 All Rights Reserved
 */
function Setup(){}

// Retrieve the header, body, and footer and return them to the router
Setup.init = function(request, output)
{   
    getDBObjectsWithValues({object_type: 'user'}, function(data)
    {
        if(data.length > 0)
        {
            output({redirect: pb.config.siteRoot});
            return;
        }
    
        getSession(request, function(session)
        {        
            var post = getPostParameters(request);
            
            if(message = checkForRequiredParameters(post, ['username', 'email', 'password', 'confirm_password']))
            {
                formError(request, session, message, '/setup', output);
                return;
            }
            
            post['admin'] = 4;
            var userDocument = createDocument('user', post);
            
            createDBObject(userDocument, function(data)
            {
                if(data.length == 0)
                {
                    formError(request, session, '^loc_ERROR_SAVING^', '/setup', output);
                    return;
                }
                
                var settingDocument = createDocument('setting', {key: 'active_theme', value: 'pencilblue'});
                createDBObject(settingDocument, function(data)
                {
                    if(data.length == 0)
                    {
                        formError(request, session, '^loc_ERROR_SAVING^', '/setup', output);
                        return;
                    }
                    
                    settingDocument = createDocument('setting', {key: 'content_settings', value: Setup.getDefaultContentSettings()});
                    createDBObject(settingDocument, function(data)
                    {
                        if(data.length == 0)
                        {
                            formError(request, session, '^loc_ERROR_SAVING^', '/setup', output);
                            return;
                        }
                    
                        session.success = '^loc_READY_TO_USE^';
                        editSession(request, session, [], function(data)
                        {        
                            output({redirect: pb.config.siteRoot + '/admin/login'});
                        });
                    });
                });
            });
        });
    });
};

Setup.getDefaultContentSettings = function()
{
    defaultContentSettings =
    {
        articles_per_page: 5,
        auto_break_articles: 0,
        display_timestamp: 1,
        date_format: 'M dd, YYYY',
        display_hours_minutes: 1,
        time_format: '12',
        display_bylines: 1,
        display_writer_photo: 1,
        display_writer_position: 1,
        allow_comments: 1,
        default_comments: 1
    };
    
    return defaultContentSettings;
};

//inheritance 
util.inherits(Setup, pb.BaseController);


Setup.prototype.render = function(cb) {
	
	var self = this;
    var dao  = new pb.DAO();
    
    dao.count('user', pb.DAO.ANYWHERE, function(err, count){
    	if (util.isError(err)) {
    		throw new PBError("A database connection could not be established", 500);
    	}
    	
    	//when user count is 1 or higher the system has already been initialized
    	if (count > 0) {
    		cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot));
    		return;
    	}
    	
    	self.doSetup(cb);
    });
};

Setup.prototype.doSetup = function(cb) {
	
	var self = this;
	this.getPostParams(function(err, post){
		if (util.isError(err)) {
			//TODO implement error handler
			pb.log.warn("ActinosSetup: Unimplemented error condition!");
			cb({content: 'Implement me!', code: 500});
			return;
		}
		
		self.onPostParamsRetrieved(post, cb);
	});
};

Setup.prototype.onPostParamsRetrieved = function(post, cb) {
	
	var reqParams = ['username', 'email', 'password', 'confirm_password'];
	var message   = this.hasRequiredParams(post, reqParams);
	if(message) {
        formError(request, session, message, '/setup', cb);
        return;
    }
    
    post['admin'] = 4; 
    var self      = this;
    async.series(
		[
			function(callback) {
				var userDocument = pb.DocumentCreator.create('user', post);
				createDBObject(userDocument, function(data) {
					if (data.length == 0) {
						callback(new PBError("Failed to persist user object", 500), null);
						return;
					}
					
					callback(null, data);
				});
			},
			function(callback) {
				pb.settings.set('active_theme',
				pb.RequestHandler.DEFAULT_THEME, callback);
			},
			function(callback) {
				var contentSettings = Setup.getDefaultContentSettings();
				pb.settings.set('content_settings', contentSettings, callback);
			} 
		], 
        function(err, results){
    		if (util.isError(err)) {
    			self.formError(request, session, '^loc_ERROR_SAVING^', '/setup', output);
                return;
    		}
    		
    		session.success = '^loc_READY_TO_USE^';
    		cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/login'));
		}
    );
};

Setup.getDefaultContentSettings = function() {
    return {
        articles_per_page: 5,
        auto_break_articles: 0,
        display_timestamp: 1,
        date_format: 'M dd, YYYY',
        display_hours_minutes: 1,
        time_format: '12',
        display_bylines: 1,
        display_writer_photo: 1,
        display_writer_position: 1,
        allow_comments: 1,
        default_comments: 1
    };
};

//exports
module.exports = Setup;
