function PluginDetailsController(){}

//dependencies
var BaseController = pb.BaseController;
var PluginService  = pb.PluginService;

//inheritance
util.inherits(PluginDetailsController, BaseController);

PluginDetailsController.prototype.render = function(cb) {
	var self = this;
	
	this.getDetails(this.pathVars.id, function(err, details) {
		if (util.isError(err)) {
			throw err;
		}
		
		if (!details) {
			self.reqHandler.serve404();
			return;
		}
		
		//angular data
		var angularData = pb.js.getAngularController(
	        {
	            navigation: pb.AdminNavigation.get(self.session, ['users', 'permissions'], self.ls),
	            d: details,
	            status: 'IMPLEMENT_ME!'
	        }, 
	        []
	    );
		
		//render page
		self.setPageName(self.ls.get('PLUGIN_DETAILS'));
		self.ts.registerLocal('plugin_icon', PluginService.genPublicPath(details.uid, details.icon));
		self.ts.load('/admin/plugins/details', function(err, content) {
			
			//TODO move angular out as flag & replacement when can add option to 
			//skip the check for replacements in replacement
			content = content.replace('^angular_script^', angularData);
			cb({content: content});
		});
	});
};

PluginDetailsController.prototype.getDetails = function(puid, cb) {
	pb.plugins.getPlugin(puid, cb);
};

//exports
module.exports = PluginDetailsController;