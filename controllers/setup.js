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
	pb.templates.load('setup', 'Setup', null, function(data) {
        var result = data;
        
        self.displayErrorOrSuccess(result, function(newResult) {
            result = newResult;
        
            var sets    = ['setup', 'users'];
            var content = self.localizationService.localize(sets, result);
            cb({content: content});
        });
    });
};

//exports
module.exports = Setup;
