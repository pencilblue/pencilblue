function PluginDetailsController(){}

//dependencies
var BaseController = pb.BaseController;
var PluginService  = pb.PluginService;
var LocalizationService = pb.LocalizationService;

//inheritance
util.inherits(PluginDetailsController, BaseController);

PluginDetailsController.prototype.render = function(cb) {
	var self = this;

	this.getDetails(this.pathVars.id, function(err, obj) {
		if (util.isError(err)) {
			throw err;
		}

		if (!obj.details) {
			self.reqHandler.serve404();
			return;
		}

		var pills = PluginDetailsController.getPillNavOptions();
		pills.unshift(
			{
				name: 'manage',
				title: self.ls.get('MANAGE') + ' ' + obj.details.name,
				icon: 'chevron-left',
				href: '/admin/plugins/'
			}
		);

		//angular data
		var angularData = pb.js.getAngularController(
	        {
	        	pills: pills,
	            navigation: pb.AdminNavigation.get(self.session, ['plugins', 'manage'], self.ls),
	            d: obj.details,
	            status: obj.status,
	            is_active: PluginService.isActivePlugin(obj.details.uid)
	        },
	        []
	    );

		//render page
		self.setPageName(obj.details.name);
		self.ts.registerLocal('plugin_icon', PluginService.genPublicPath(obj.details.uid, obj.details.icon));
		self.ts.load('/admin/plugins/details', function(err, content) {

			//TODO move angular out as flag & replacement when can add option to
			//skip the check for replacements in replacement
			content = content.replace('^angular_script^', angularData);
			cb({content: content});
		});
	});
};

PluginDetailsController.prototype.getDetails = function(puid, cb) {
	var self = this;

	pb.plugins.getPlugin(puid, function(err, plugin) {
		if (util.isError(err)) {
			cb(err, plugin);
			return;
		}

		if (plugin) {
			var obj = {
				details: plugin,
				status:  self.ls.get(PluginService.isActivePlugin(plugin.uid) ? 'ACTIVE' : 'INACTIVE')
			};
			cb(err, obj);
			return;
		}

		//try to load the details file.  We assume the puid variable is the
		//plugin directory name
		var detailsFile = PluginService.getDetailsPath(puid);
		PluginService.loadDetailsFile(detailsFile, function(err, details) {
			var obj = {
				status: self.ls.get('ERRORED')
			};
			if (util.isError(err)) {
				obj.details = {
					name: puid,
					uid: puid,
					errors: [err.message]
				};
				cb(null, obj);
				return;
			}

			//validate details
			PluginService.validateDetails(details, puid, function(err, result) {
				obj.details = details;
				if (util.isError(err)) {
					details.errors = err.validationErrors;
					cb(null, obj);
					return;
				}
				obj.status = self.ls.get('AVAILABLE');
				cb(null, obj);
			});
		});
	});
};

PluginDetailsController.getPillNavOptions = function(activePill) {
	var pillNavOptions = [];

    if(typeof activePill !== 'undefined') {
        for(var i = 0; i < pillNavOptions.length; i++) {
            if(pillNavOptions[i].name == activePill) {
                pillNavOptions[i].active = 'active';
            }
        }
    }
    return pillNavOptions;
};

//exports
module.exports = PluginDetailsController;
