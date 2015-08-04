/*
	Copyright (C) 2015  PencilBlue, LLC

	This program is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

module.exports = function(pb) {
    
    //pb dependencies
    var util           = pb.util;

    /**
     * Interface for changing a plugin's settings
     * @class PluginSettingsFormController
     * @constructor
     * @extends BaseAdminController
     */
    function PluginSettingsFormController(){
    
        /**
         *
         * @property pluginService
         * @type {PluginService}
         */
        this.pluginService = new pb.PluginService();
    }
    util.inherits(PluginSettingsFormController, pb.BaseAdminController);

    /**
     * Initialize controller and plugin service
     * @override
     * @param props
     * @param cb
     */
    PluginSettingsFormController.prototype.init = function (props, cb) {
        var self = this;
        pb.BaseAdminController.prototype.init.call(self, props, function () {
            self.pluginService = new pb.PluginService({site: self.site});
            cb();
        });
    };

    //statics
    var SUB_NAV_KEY = 'plugin_settings';

    
    PluginSettingsFormController.prototype.get = function(cb) {
        var self = this;

        var uid = this.pathVars.id;
        this.pluginService.getPluginBySite(uid, function(err, plugin) {
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

                var clone = util.copyArray(settings);
                for (var i = 0; i < clone.length; i++) {
                    var item = clone[i];

                    item.displayName = item.name.split('_').join(' ');
                    item.displayName = item.displayName.charAt(0).toUpperCase() + item.displayName.slice(1);

                    if (item.value === true || item.value === false) {
                        item.type = 'checkbox';
                    }
                    else if (util.isString(item.value)) {
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

                //setup angular
                var data = {
                    plugin: plugin,
                    settingType: self.getType()
                };
                var angularObjects = pb.ClientJs.getAngularObjects({
                    pills: self.getAdminPills(SUB_NAV_KEY, self.ls, null, data),
                    tabs: tabs,
                    navigation: pb.AdminNavigation.get(self.session, ['plugins', 'manage'], self.ls, self.site),
                    settings: clone,
                    pluginUID: uid,
                    type: data.settingType
                });

                //render page
                self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
                self.ts.load('/admin/plugins/plugin_settings', function(err, result) {
                    cb({content: result});
                });
            });
        });
    };
    
    
    PluginSettingsFormController.prototype.post = function(cb) {
        var self = this;
        var post = this.body;
        
        //retrieve settings
        var uid = this.pathVars.id;
        self.getSettings(uid, function(err, settings) {
            if(util.isError(err)) {
                return self.reqHandler.serveError(err);
            }
            else if (util.isNullOrUndefined(settings)) {
                return cb({
                    code: 400,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('INVALID_UID'))
                });
            }

            var errors = [];
            for (var i = 0; i < settings.length; i++) {

                var currItem = settings[i];
                var newVal   = post[currItem.name];
                var type     = PluginSettingsFormController.getValueType(currItem.value);
                if (util.isNullOrUndefined(newVal)) {
                    if (type === 'boolean') {
                        newVal = false;
                    }
                    else {
                        errors.push(util.format("The %s setting must be provided", currItem.name));
                        continue;
                    }
                }

                //validate the value
                if (!PluginSettingsFormController.validateValue(newVal, type)) {
                    errors.push(util.format("The value [%s] for setting %s is not a valid %s", newVal, currItem.name, type));
                    continue;
                }

                //set the new value
                currItem.value = PluginSettingsFormController.formatValue(newVal, type);
            }

            //handle errors
            if(errors.length > 0) {
                cb({
                    code: 400,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, errors.join("\n"))
                });
                return;
            }

            //persist new settings
            self.setSettings(settings, uid, function(err, result) {
                if(util.isError(err) || !result) {
                    cb({
                        code: 500,
                        content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('SAVE_PUGIN_SETTINGS_FAILURE'))
                    });
                    return;
                }

                cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, self.ls.get('SAVE_PLUGIN_SETTINGS_SUCCESS'))});
            });
        });
    };
    
    /**
     *
     * @method getPageName
     *
     */
    PluginSettingsFormController.prototype.getPageName = function() {
        return this.plugin.name + ' - ' + this.ls.get('SETTINGS');
    };

    /**
     *
     * @method getSettings
     *
     */
    PluginSettingsFormController.prototype.getSettings = function(uid, cb) {
        this.pluginService.getSettings(uid, cb);
    };

    /**
     *
     * @method setSettings
     *
     */
    PluginSettingsFormController.prototype.setSettings = function(settings, uid, cb) {
        this.pluginService.setSettings(settings, uid, cb);
    };


    /**
     *
     * @method getType
     * @return {String}
     */
    PluginSettingsFormController.prototype.getType = function() {
        return 'plugins';
    };

    /**
     * @static
     * @method render
     *
     */
    PluginSettingsFormController.getSubNavItems = function(key, ls, data) {
        return [
            {
                name: 'manage_plugins',
                title: data.plugin.name + ' ' + ls.get('SETTINGS'),
                icon: 'chevron-left',
                href: '/admin/' + data.settingType
            }
        ];
    };

    /**
     * @static
     * @method getValueInputType
     *
     */
    PluginSettingsFormController.getValueInputType = function(value) {
        var type = '';
        if (value === true || value === false) {
            type = 'checkbox';
        }
        else if (util.isString(value)) {
            type = 'text';
        }
        else if (!isNaN(value)) {
            type = 'number';
        }
        return type;
    };

    /**
     * @static
     * @method getValueType
     *
     */
    PluginSettingsFormController.getValueType = function(value) {
        var type = '';
        if (value === true || value === false) {
            type = 'boolean';
        }
        else if (util.isString(value)) {
            type = 'string';
        }
        else if (!isNaN(value)) {
            type = 'number';
        }
        return type;
    };

    /**
     * @static
     * @method validateValue
     *
     */
    PluginSettingsFormController.validateValue = function(value, type) {
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

    /**
     * @static
     * @method formatValue
     *
     */
    PluginSettingsFormController.formatValue = function(value, type) {
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

            if (util.isString(value)) {
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

    //register admin sub-nav
    pb.AdminSubnavService.registerFor(SUB_NAV_KEY, PluginSettingsFormController.getSubNavItems);

    //exports
    return PluginSettingsFormController;
};
