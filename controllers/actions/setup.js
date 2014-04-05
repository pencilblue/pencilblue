/**
 * 
 * @copyright PencilBlue, LLC 2014 All Rights Reserved
 */
function Setup(){}

//inheritance 
util.inherits(Setup, pb.BaseController);


Setup.prototype.render = function(cb) {
	
	var self = this;    
    pb.settings.get('system_initialized', function(err, isSetup){
    	if (util.isError(err)) {
    		throw new PBError("A database connection could not be established", 500);
    	}
    	
    	//when user count is 1 or higher the system has already been initialized
    	if (isSetup) {
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
	var self = this;
	
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
				
				var dao = new pb.DAO();
				dao.update(userDocument).then(function(data) {
					if (util.isError(data)) {
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
				pb.content.getSettings(function(contentSettings) {
					pb.settings.set('content_settings', contentSettings, callback);
				});
			},
			function(callback) {
				pb.settings.set('system_initialized', true, callback);
			}
		], 
        function(err, results){
    		if (util.isError(err)) {
    			self.formError(self.ls.get('ERROR_SAVING'), '/setup', cb);
                return;
    		}
    		
    		self.session.success = self.ls.get('READY_TO_USE');
    		cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/login'));
		}
    );
};

//exports
module.exports = Setup;
