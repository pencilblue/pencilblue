function PluginsIndex(){}

//dependencies
var BaseController = pb.BaseController;

//inheritance
util.inherits(PluginsIndex, BaseController);

//statics
var SUB_NAV_KEY = 'plugins_index';

PluginsIndex.prototype.render = function(cb) {
	var self = this;

	//get the data
	pb.plugins.getPluginMap(function(err, map) {
		if (util.isError(err)) {
			self.reqHandler.serveError(err);
			return;
		}

		var pills = pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls);

		//setup angular
		var angularData = pb.js.getAngularController(
            {
                navigation: pb.AdminNavigation.get(self.session, ['plugins', 'manage'], self.ls),
				pills: pills,
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

PluginsIndex.getSubNavItems = function(key, ls, data) {
	return [
        {
			name: 'manage_plugins',
			title: ls.get('MANAGE_PLUGINS'),
			icon: 'refresh',
			href: '/admin/plugins'
		}
    ];
};

//register admin sub-nav
pb.AdminSubnavService.registerFor(SUB_NAV_KEY, PluginsIndex.getSubNavItems);

//exports
module.exports = PluginsIndex;
