/*
 Copyright (C) 2016  PencilBlue, LLC

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
'use strict';

//dependencies
const _ = require('lodash');
const ArrayUtils = require('../../../../lib/utils/array_utils');
const async = require('async');
const BaseObjectService = require('../../base_object_service');
const Configuration = require('../../../config');
const fs = require('fs');
const path = require('path');
const PluginService = require('../plugin_service');
const SecurityService = require('../../../access_management');
const semver = require('semver');
const TaskUtils = require('../../../../lib/utils/taskUtils');
const ValidationService = require('../../../validation/validation_service');

/**
 * @class PluginValidationService
 * @constructor
 * @param {object} context
 */
function PluginValidationService(context){}

/**
 * Validates a plugin
 * @method validate
 * @param {object} plugin
 * @param {object} opts
 * @param {function} cb
 */
PluginValidationService.prototype.validate = function(plugin, opts, cb) {
    var validationTasks = this.getTasks(plugin, opts);
    async.series(validationTasks, PluginValidationService.getResultReducer(cb));
};

/**
 * @method getTasks
 * @param {object} plugin
 * @param {object} opts
 */
PluginValidationService.prototype.getTasks = function(plugin, opts) {
    return [
        TaskUtils.wrapTask(this, this.validateUid, [plugin, opts]),
        TaskUtils.wrapTask(this, this.validateName, [plugin, opts]),
        TaskUtils.wrapTask(this, this.validateDescription, [plugin, opts]),
        TaskUtils.wrapTask(this, this.validateVersion, [plugin, opts]),
        TaskUtils.wrapTask(this, this.validatePbVersionCompatibility, [plugin, opts]),
        TaskUtils.wrapTask(this, this.validateIcon, [plugin, opts]),
        TaskUtils.wrapTask(this, this.validateAuthor, [plugin, opts]),
        TaskUtils.wrapTask(this, this.validateSettings, [plugin, opts]),
        TaskUtils.wrapTask(this, this.validatePermissions, [plugin, opts]),
        TaskUtils.wrapTask(this, this.validateMainModule, [plugin, opts]),
        TaskUtils.wrapTask(this, this.validateTheme, [plugin, opts]),
        TaskUtils.wrapTask(this, this.validateDependencies, [plugin, opts])
    ];
};

/**
 * @method validateUid
 * @param {object} plugin
 * @param {string} plugin.uid
 * @param {object} opts
 * @param {function} cb
 */
PluginValidationService.prototype.validateUid = function(plugin, opts, cb) {
    var err = null;
    if (!ValidationService.isSafeFileName(plugin.uid, true)) {
        err = BaseObjectService.validationFailure('uid', 'The uid field must be provided and can only contain alphanumerics, underscores, and dashes');
    }
    cb(null, err);
};

/**
 * @method validateName
 * @param {object} plugin
 * @param {string} plugin.name
 * @param {object} opts
 * @param {function} cb
 */
PluginValidationService.prototype.validateName = function(plugin, opts, cb) {
    var err = null;
    if (!ValidationService.isNonEmptyStr(plugin.name, true)) {
        err = BaseObjectService.validationFailure('name', 'An invalid name was provided');
    }
    cb(null, err);
};

/**
 * @method validateDescription
 * @param {object} plugin
 * @param {string} plugin.description
 * @param {object} opts
 * @param {function} cb
 */
PluginValidationService.prototype.validateDescription = function(plugin, opts, cb) {
    var err = null;
    if (!ValidationService.isNonEmptyStr(plugin.description, true)) {
        err = BaseObjectService.validationFailure('description', 'A valid description must be provided');
    }
    cb(null, err);
};

/**
 * @method validateVersion
 * @param {object} plugin
 * @param {string} plugin.version
 * @param {object} opts
 * @param {function} cb
 */
PluginValidationService.prototype.validateVersion = function(plugin, opts, cb) {
    var err = null;
    if (!ValidationService.isVersionNum(plugin.version, true)) {
        err = BaseObjectService.validationFailure('version', 'An invalid version number was provided.  Must match the form: xx.xx.xx');
    }
    cb(null, err);
};

/**
 * @method validatePbVersionCompatibility
 * @param {object} plugin
 * @param {string} plugin.pb_version
 * @param {object} opts
 * @param {function} cb
 */
PluginValidationService.prototype.validatePbVersionCompatibility = function(plugin, opts, cb) {
    var err = null;
    if (_.isString(plugin.pb_version)) {
        if (!ValidationService.isVersionExpression(plugin.pb_version, true)) {
            err = BaseObjectService.validationFailure('pb_version', 'An invalid version expression was provided.');
        }

        //validate pb_version in config against pb version
        else if (!semver.satisfies(Configuration.active.version, plugin.pb_version)) {
            err = BaseObjectService.validationFailure('pb_version', 'Version ' + plugin.pb_version + ' is incompatible with PencilBlue version ' + Configuration.active.version);
        }
    }
    cb(null, err);
};

/**
 * @method validateIcon
 * @param {object} plugin
 * @param {string} plugin.uid
 * @param {string} [plugin.icon]
 * @param {object} opts
 * @param {function} cb
 */
PluginValidationService.prototype.validateIcon = function(plugin, opts, cb) {
    var err = null;
    if (plugin.icon) {
        if (!_.isString(plugin.icon) || !PluginValidationService.validateIconPath(plugin.icon, plugin.uid)) {
            err = BaseObjectService.validationFailure('icon', 'The optional plugin icon must be a valid path to an image');
        }
    }
    cb(null, err);
};

/**
 * @method validateAuthor
 * @param {object} plugin
 * @param {object} plugin.author
 * @param {string} plugin.author.name
 * @param {string} plugin.author.email
 * @param {string} [plugin.author.website]
 * @param {Array} [plugin.author.contributors]
 * @param {object} opts
 * @param {function} cb
 */
PluginValidationService.prototype.validateAuthor = function(plugin, opts, cb) {
    if (!plugin.author) {
        return cb(null, BaseObjectService.validationFailure('author', 'The author block is required and must be an object'));
    }

    var errors = [];
    var author = plugin.author;

    //validate name
    if (!ValidationService.isNonEmptyStr(author.name, true)) {
        errors.push(BaseObjectService.validationFailure('author.name', 'A valid author name must be provided'));
    }

    //validate email
    if (!ValidationService.isEmail(author.email, true)) {
        errors.push(BaseObjectService.validationFailure('author.email', 'A valid author email must be provided'));
    }

    //validate website
    if (!ValidationService.isUrl(author.website, false)) {
        errors.push(BaseObjectService.validationFailure('author.website', 'The website address is not a valid URL'));
    }

    //validate contributors
    if (!author.contributors) {
        return cb(null, errors);
    }
    else if (!ValidationService.isArray(author.contributors, true)) {
        errors.push(BaseObjectService.validationFailure('author.website', 'The author contributors block must be an array'));
        return cb(null, errors);
    }

    var self = this;
    var contributorTasks = author.contributors.map(function(contributor, i) {
        return TaskUtils.wrapTask(self, self.validateContributor, [contributor, { index: i }]);
    });
    async.series(contributorTasks, PluginValidationService.getResultReducer(cb, errors));
};

/**
 * @method validateContributor
 * @param {object} contributor
 * @param {object} context
 * @param {integer} context.index
 * @param {function} cb
 */
PluginValidationService.prototype.validateContributor = function(contributor, context, cb) {
    var err = null;
    if (ValidationService.isObj(contributor, true)) {

        //validate contributor name
        if (!ValidationService.isNonEmptyStr(contributor.name, true)) {
            BaseObjectService.validationFailure('author.contributors['+context.index+'].name', 'The contributor name must be provided');
        }

        //validate contributor email
        if (!ValidationService.isEmail(contributor.email, false)) {
            BaseObjectService.validationFailure('author.contributors['+context.index+'].email', 'The contributor email is invalid');
        }
    }
    else {
        BaseObjectService.validationFailure('author.contributors['+context.index+']', 'The contributor must be an object');
    }
    cb(null, err);
};

/**
 * @method validateSettings
 * @param {object} plugin
 * @param {Array} [plugin.settings]
 * @param {object} opts
 * @param {string} [opts.prefix]
 * @param {function} cb
 */
PluginValidationService.prototype.validateSettings = function(plugin, opts, cb) {
    var prefix = (opts.prefix ? opts.prefix + '.' : '') + 'settings';
    if (!plugin.settings) {
        return cb();
    }
    if (!ValidationService.isArray(plugin.settings, true)) {
        return cb(null, BaseObjectService.validationFailure(prefix, 'The settings block must be an array'));
    }

    //validate each setting
    var self = this;
    var tasks = plugin.settings.map(function(setting) {
        return TaskUtils.wrapTask(self, self.validateSetting, [setting, { index: 1, prefix: opts.prefix }]);
    });
    async.series(tasks, PluginValidationService.getResultReducer(cb));
};

/**
 * Validates a setting from a details.json file.
 * @method validateSetting
 * @param {object} setting The setting to validate
 * @param {object} context
 * @param {integer} context.index The position in the settings array where the setting resides
 * as a 0 based index.
 * @param {string} [context.prefix]
 * @param {function} cb
 */
PluginValidationService.prototype.validateSetting = function(setting, context, cb) {
    var fieldPrefix = context.prefix ? context.prefix + '.' : 'settings['+context.index+']';
    if (!_.isObject(setting)) {
        return cb(null, BaseObjectService.validationFailure(fieldPrefix, 'The setting value must be an object'));
    }

    //validate displayName
    var errors = [];
    if (!ValidationService.isNonEmptyStr(setting.displayName, false)) {
        errors.push(BaseObjectService.validationFailure(fieldPrefix+'.displayName', 'The setting display name must be a non-empty string'));
    }

    //validate group
    if (!ValidationService.isNonEmptyStr(setting.group, false)) {
        errors.push(BaseObjectService.validationFailure(fieldPrefix+'.group', 'The setting group must be a non-empty string'));
    }

    //validate name
    if (!ValidationService.isNonEmptyStr(setting.name, true)) {
        errors.push(BaseObjectService.validationFailure(fieldPrefix+'.name', 'The setting name must be provided'));
    }

    //validate value
    if (!PluginValidationService.validateSettingValue(setting.value)) {
        errors.push(BaseObjectService.validationFailure(fieldPrefix+'.value', 'The setting value must be provided'));
    }

    cb(null, errors);
};

/**
 * @method validatePermissions
 * @param {object} plugin
 * @param {object} plugin.permissions
 * @param {object} opts
 * @param {function} cb
 */
PluginValidationService.prototype.validatePermissions = function(plugin, opts, cb) {
    if (!ValidationService.isObj(plugin.permissions, true)) {
        return cb(null, BaseObjectService.validationFailure('permissions', 'The permissions block is required and must be an object'));
    }

    //create map of system roles
    var validKeys = {};
    SecurityService.SYSTEM_ROLES.forEach(function(roleObj) {
        validKeys[roleObj.key] = true;
    });

    //iterate permissions
    var errors = [];
    Object.keys(plugin.permissions).forEach(function(key) {
        if (!validKeys[key]) {
            errors.push(BaseObjectService.validationFailure('permissions['+key+']', 'An invalid permissions map key was provided'));
            return;
        }

        var val = plugin.permissions[key];
        if (ValidationService.isArray(val, true)) {

            for (var i = 0; i < plugin.permissions[key].length; i++) {
                if (!ValidationService.isNonEmptyStr(plugin.permissions[key][i], true)) {
                    errors.push(BaseObjectService.validationFailure('permissions.'+key+'['+i+']', 'The value is invalid'));
                }
            }
        }
        else {
            errors.push(BaseObjectService.validationFailure('permissions.'+key, 'Permissions map key must provide an array of permissions'));
        }
    });
    cb(null, errors);
};

/**
 * @method validateMainModule
 * @param {object} plugin
 * @param {object} plugin.main_module
 * @param {string} plugin.main_module.path
 * @param {string} plugin.uid
 * @param {object} opts
 * @param {function} cb
 */
PluginValidationService.prototype.validateMainModule = function(plugin, opts, cb) {
    var err = null;
    if (ValidationService.isObj(plugin.main_module, true)) {

        if (!PluginValidationService.validateMainModulePath(plugin.main_module.path, plugin.uid)) {
            err = BaseObjectService.validationFailure('main_module.path', 'An invalid main module path and/or file was provided');
        }
    }
    else {
        err = BaseObjectService.validationFailure('main_module', 'The main module block is required and must be an object');
    }
    cb(null, err);
};

/**
 * @method validateTheme
 * @param {object} plugin
 * @param {object} opts
 * @param {function} cb
 */
PluginValidationService.prototype.validateTheme = function(plugin, opts, cb) {
    if (!plugin.theme) {
        return cb(null, null);
    }
    if (!ValidationService.isObj(plugin.theme, true)) {
        return cb(null, BaseObjectService.validationFailure('theme', 'The theme block must be an object'));
    }

    var tasks = [
        TaskUtils.wrapTask(this, this.validateSettings, [plugin.theme, { prefix: 'theme' }]),
        TaskUtils.wrapTask(this, this.validateContentTemplates, [plugin, opts])
    ];
    async.series(tasks, PluginValidationService.getResultReducer(cb));
};

/**
 * @method validateContentTemplates
 * @param {object} plugin
 * @param {object} plugin.theme
 * @param {Array} plugin.theme.content_templates
 * @param {object} opts
 * @param {function} cb
 */
PluginValidationService.prototype.validateContentTemplates = function(plugin, opts, cb) {
    if (!plugin.theme.content_templates) {
        return cb();
    }
    if (!ValidationService.isArray(plugin.theme.content_templates, true)) {
        return cb(null, BaseObjectService.validationFailure('theme.content_templates', 'The content templates property must be an array'));
    }

    //validate each content template
    var errors = [];
    for (var i = 0; i < plugin.theme.content_templates.length; i++) {

        var template = plugin.theme.content_templates[i];
        if (ValidationService.isObj(template, true)) {

            //validate content template name
            if (!ValidationService.isNonEmptyStr(template.name, true)) {
                errors.push(BaseObjectService.validationFailure('theme.content_templates['+i+'].name', 'The content template name is invalid'));
            }

            //validate content template file
            if (!ValidationService.isSafeFileName(template.file, true)) {
                errors.push(BaseObjectService.validationFailure('theme.content_templates['+i+'].file', 'The content template file is invalid'));
            }
        }
        else {
            errors.push(BaseObjectService.validationFailure('theme.content_templates['+i+']', 'The content template is invalid'));
        }
    }
    cb(null, errors);
};

/**
 * @method validate
 * @param {object} plugin
 * @param {object} [plugin.dependencies]
 * @param {object} opts
 * @param {function} cb
 */
PluginValidationService.prototype.validateDependencies = function(plugin, opts, cb) {
    if (!plugin.dependencies) {
        return cb();
    }
    if (!_.isObject(plugin.dependencies)) {
        return cb(null, BaseObjectService.validationFailure('dependencies', 'The dependencies block must be an object'));
    }

    var errors = [];
    Object.keys(plugin.dependencies).forEach(function(moduleName) {
        if (!ValidationService.isNonEmptyStr(plugin.dependencies[moduleName], true)) {
            errors.push(BaseObjectService.validationFailure('dependencies.'+moduleName, 'An invalid dependencies with version ['+(typeof plugin.dependencies[moduleName])+']['+plugin.dependencies[moduleName]+'] was found'));
        }
    });
    cb(null, errors);
};

/**
 * Validates the path of a main module file.  The path is considered valid if
 * the path points to JS file.  The path may be absolute or relative to the
 * specific plugin directory.
 * @static
 * @method validateMainModulePath
 * @param mmPath The relative or absolute path to the main module file
 * @param pluginDirName The name of the directory housing the plugin
 * @return {Boolean} TRUE if the path is valid, FALSE if not
 */
PluginValidationService.validateMainModulePath = function(mmPath, pluginDirName) {
    var pluginMM = path.join(PluginService.getPluginsDir(), pluginDirName, mmPath);
    var paths    = [pluginMM, mmPath];

    for (var i = 0; i < paths.length; i++) {
        try {
            if (fs.existsSync(paths[i])) {
                return true;
            }
        }
        catch(e) {}
    }
    return false;
};

/**
 * Validates a details.json file's setting value.  The value is required to be a
 * string or a number.  Null, undefined, Arrays, Objects, and prototypes are NOT
 * allowed.
 * @static
 * @method validateSettingValue
 * @param {Boolean|Integer|Number|String} value The value to validate
 * @return {Boolean} TRUE if the value is valid, FALSE if not
 */
PluginValidationService.validateSettingValue = function(value) {
    return _.isString(value) || !isNaN(value) || value === true || value === false;
};

/**
 * Validates the path to the plugin's icon file.  The path is considered valid
 * if the path to a valid file.  The path may be absolute or relative to the
 * plugin's public directory.
 * @static
 * @method validateIconPath
 * @param iconPath The path to the icon (image) file
 * @param pluginDirName The name of the directory housing the plugin
 * @return {Boolean} TRUE if the path is valid, FALSE if not
 */
PluginValidationService.validateIconPath = function(iconPath, pluginDirName) {
    var pluginPublicIcon = path.join(PluginService.getPublicPath(pluginDirName), iconPath);
    var paths            = [pluginPublicIcon, iconPath];

    for (var i = 0; i < paths.length; i++) {
        if (fs.existsSync(paths[i])) {
            return true;
        }
    }
    return false;
};

/**
 * Creates the function that will be used to reduce the validation errors from other tasks down to a single array
 * @static
 * @method getResultReducer
 * @param {function} cb
 * @param {Array} [existingErrors] The array of existing errors that will be appended to
 * @returns {Function}
 */
PluginValidationService.getResultReducer = function(cb, existingErrors) {
    return function (err, results) {
        if (_.isError(err)) {
            return cb(err);
        }

        var validationErrors = results.reduce(function(prev, err) {
            if (Array.isArray(err)) {
                ArrayUtils.pushAll(err, prev);
            }
            else if (_.isObject(err)) {
                prev.push(err);
            }
            return prev;
        }, existingErrors || []);
        cb(err, validationErrors);
    };
};

module.exports = PluginValidationService;
