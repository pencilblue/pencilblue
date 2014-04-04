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
	this.setPageName('Setup');
	this.ts.load('setup', function(err, data) {
        cb({content: data});
    });
};

//exports
module.exports = Setup;
