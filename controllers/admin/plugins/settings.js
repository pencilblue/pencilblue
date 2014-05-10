function PluginSettingsController(){}

//dependencies
var BaseController = pb.BaseController;

//inheritance
util.inherits(PluginSettingsController, BaseController);

PluginSettingsController.prototype.render = function(cb) {
	if (this.req.method !== 'GET' && this.req.method !== 'POST') {
		var data = {
			code: 405,
			headers: {
				Allow: 'GET, POST'
			},
			content: this.ls.get('INVALID_METHOD')
		};
		cb(data);
		return;
	}
	
	switch(this.req.method) {
	case 'GET':
		this.renderGet(cb);
		break;
	case 'POST':
		this.renderPost(cb);
		break;
	default:
		throw new Error(this.ls.get('INVALID_METHOD'));
	}
};

PluginSettingsController.prototype.renderGet = function(cb) {
	var self = this;
	
	var uid = this.pathVars.id;
	pb.plugins.getPlugin(uid, function(err, plugin) {
		if (util.isError(err)) {
			throw err;
		}
		else if (plugin == null) {
			self.reqHandler.serve404();
			return;
		}
		
		//retrieve settings
		self.plugin = plugin;
		self.getSettings(uid, function(err, settings) {
			if (util.isError(err)) {
				throw err;
			}
			else if (settings == null) {
				self.reqHandler.serve404();
				return;
			}
			
			var clone = pb.utils.copyArray(settings);
			for (var i = 0; i < clone.length; i++) {
				var item = clone[i];
				if (item.value === true || item.value === false) {
					item.type = 'checkbox';
				}
				else if (pb.utils.isString(item.value)) {
					item.type = 'text';
				}
				else if (!isNaN()) {
					item.type = 'number';
				}
			}
			//setup angular
			var angularData = pb.js.getAngularController(
	            {
	            	pills: PluginSettingsController.getPillNavOptions(),
	                navigation: pb.AdminNavigation.get(self.session, ['plugins', 'manage'], self.ls),
	                settings: clone
	            }, 
	            []
	        );
			
			//render page
			self.ts.registerLocal('form_action', self.getFormAction(uid));
			self.ts.load('/admin/plugins/settings', function(err, content) {
				
				//TODO move angular out as flag & replacement when can add option to 
				//skip the check for replacements in replacement
				content = content.replace('^angular_script^', angularData);
				cb({content: content});
			});
		});
	});
};

PluginSettingsController.prototype.getFormAction = function(uid) {
	return '/admin/plugins/settings/' + encodeURIComponent(uid);
};

PluginSettingsController.prototype.getPageName = function() {
	return this.plugin.name + ' - ' + this.ls.get('SETTINGS');
};

PluginSettingsController.prototype.getSettings = function(uid, cb) {
	pb.plugins.getSettings(uid, cb);
};

PluginSettingsController.getPillNavOptions = function(activePill) {
    var pillNavOptions = 
    [
        {
            name: 'manage',
            title: 'Manage',
            icon: 'chevron-left',
            href: '/admin/plugins/'
        }
    ];
    
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
module.exports = PluginSettingsController;
