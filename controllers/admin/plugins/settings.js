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

	var self = this;
	switch(this.req.method) {
	case 'GET':
		this.renderGet(cb);
		break;
	case 'POST':
		this.getPostParams(function(err, post) {
			self.renderPost(post, cb);
		});
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
		else if (plugin === null) {
			self.reqHandler.serve404();
			return;
		}

		//retrieve settings
		self.plugin = plugin;
		self.getSettings(uid, function(err, settings) {
			if (util.isError(err)) {
				throw err;
			}
			else if (settings === null) {
				self.reqHandler.serve404();
				return;
			}

			var clone = pb.utils.copyArray(settings);
			for (var i = 0; i < clone.length; i++) {
				var item = clone[i];

				item.displayName = item.name.split('_').join(' ');
				item.displayName = item.displayName.charAt(0).toUpperCase() + item.displayName.slice(1);

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

			var tabs = [
				{
					active: 'active',
					href: '#plugin_settings',
					icon: 'cog',
					title: self.ls.get('SETTINGS')
				}
			];

			var pills = self.getPillNavOptions();
			pills.unshift({
				name: 'manage_plugins',
				title: self.plugin.name + ' ' + self.ls.get('SETTINGS'),
				icon: 'chevron-left',
				href: '/admin/plugins'
			});

			//setup angular
			var angularData = pb.js.getAngularController(
	            {
	            	pills: pills,
					tabs: tabs,
	                navigation: pb.AdminNavigation.get(self.session, ['plugins', 'manage'], self.ls),
	                settings: clone
	            },
	            []
	        );

			//render page
			self.ts.registerLocal('form_refill', function(flag, cb) {
				self.checkForFormRefill(' ', function(refill) {
					cb(null, refill);
				});
			});
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
	return this.req.url;
};

PluginSettingsController.prototype.getPageName = function() {
	return this.plugin.name + ' - ' + this.ls.get('SETTINGS');
};

PluginSettingsController.prototype.getSettings = function(uid, cb) {
	pb.plugins.getSettings(uid, cb);
};

PluginSettingsController.prototype.setSettings = function(settings, uid, cb) {
	pb.plugins.setSettings(settings, uid, cb);
};

PluginSettingsController.prototype.renderPost = function(post, cb) {
	var self = this;

	//retrieve settings
	var uid = this.pathVars.id;
	this.getSettings(uid, function(err, settings) {
		if (util.isError(err)) {
			throw err;
		}
		else if (settings === null) {
			self.reqHandler.serve404();
			return;
		}

		var errors = [];
		for (var i = 0; i < settings.length; i++) {

			var currItem = settings[i];
			var newVal   = post[currItem.name];
			var type     = PluginSettingsController.getValueType(currItem.value);
			if (newVal === undefined || null) {
				if (type === 'boolean') {
					newVal = false;
				}
				else {
					errors.push(util.format("The %s setting must be provided", currItem.name));
					continue;
				}
			}

			//validate the value
			if (!PluginSettingsController.validateValue(newVal, type)) {
				errors.push(util.format("The value [%s] for setting %s is not a valid %s", newVal, currItem.name, type));
				continue;
			}

			//set the new value
			currItem.value = PluginSettingsController.formatValue(newVal, type);
		}

		//handle errors
		if (errors.length > 0) {
			self.session.error = errors.join("\n");
			self.setFormFieldValues(post);
			self.redirect(self.req.url, cb);
			return;
		}

		//persist new settings
		self.setSettings(settings, uid, function(err, result) {
			if (util.isError(err)) {
				throw err;
			}

			//set for success and redirect
			if (result) {
				self.session.success = self.ls.get('SAVE_PLUGIN_SETTINGS_SUCCESS');
			}
			else {
				self.session.error = self.ls.get('SAVE_PUGIN_SETTINGS_FAILURE');
			}
			self.redirect(self.req.url, cb);
		});
	});
};

PluginSettingsController.prototype.getBackUrl = function() {
	return '/admin/plugins/';
};

PluginSettingsController.prototype.getPillNavOptions = function(activePill) {

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

PluginSettingsController.getValueInputType = function(value) {
	var type = '';
	if (value === true || value === false) {
		type = 'checkbox';
	}
	else if (pb.utils.isString(value)) {
		type = 'text';
	}
	else if (!isNaN(value)) {
		type = 'number';
	}
	return type;
};

PluginSettingsController.getValueType = function(value) {
	var type = '';
	if (value === true || value === false) {
		type = 'boolean';
	}
	else if (pb.utils.isString(value)) {
		type = 'string';
	}
	else if (!isNaN(value)) {
		type = 'number';
	}
	return type;
};

PluginSettingsController.validateValue = function(value, type) {
	if (type === 'boolean') {
		return value !== null && value !== undefined && (value === true || value === false || value === 1 || value === 0 || value == '1' || value === '0' || value.toLowerCase() === 'true' || value.toLowerCase() === 'false');
	}
	else if (type === 'string') {
		return pb.validation.validateStr(value, true);
	}
	else if (type === 'number') {
		return !isNaN(value);
	}
	return false;
};

PluginSettingsController.formatValue = function(value, type) {
	if (value === null || value === undefined || type === null || type === undefined) {
		throw new Error("Value and type must be provided");
	}

	if (type === 'boolean') {
		switch(value) {
		case true:
		case 1:
		case '1':
			return true;
		case false:
		case 0:
		case '0':
			return false;
		}

		if (pb.utils.isString(value)) {
			value = value.toLowerCase();
			return value === 'true';
		}
		else {
			return null;
		}
	}
	else if (type === 'string') {
		return '' + value;
	}
	else if (type === 'number') {
		return Number(value);
	}
	return null;
};

//exports
module.exports = PluginSettingsController;
