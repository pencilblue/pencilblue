function PluginsIndex(){}

//dependencies
var BaseController = pb.BaseController;

//inheritance
util.inherits(PluginsIndex, BaseController);


PluginsIndex.prototype.render = function(cb) {
	var self = this;
	
	//get the data
	pb.plugins.getPluginMap(function(err, map) {
		if (util.isError(err)) {
			self.reqHandler.serveError(err);
			return;
		}
		
		//setup angular
		var angularData = pb.js.getAngularController(
            {
                navigation: pb.AdminNavigation.get(self.session, ['plugins', 'manage'], self.ls),
                installedPlugins: map.active,
                inactivePlugins: map.inactive,
                availablePlugins: map.available
            }, 
            []
        );
		
		//load the template
		//self.ts.registerLocal('angular_script', angularData);
		self.ts.load('/admin/plugins/index', function(err, content) {
			
			//TODO move angular out as flag & replacement when can add option to 
			//skip the check for replacements in replacement
			content = content.replace('^angular_script^', angularData);
			cb({content: content});
		});
	});
};

//exports
module.exports = PluginsIndex;
