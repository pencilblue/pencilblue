/*
    Copyright (C) 2017  PencilBlue, LLC

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
const Configuration = require('../../include/config');
const path = require('path');
const UrlUtils = require('./urlUtils');

/**
 *
 */
class PluginUtils {

    /**
     * The absolute path to the plugins directory for this PecilBlue installation
     * @property PLUGINS_DIR
     * @type {String}
     */
    static get PLUGINS_DIR() {
        return Configuration.active.docRoot + path.sep + 'plugins';
    }

    /**
     * The name of the file that defines the plugin's properties
     * @property DETAILS_FILE_NAME
     * @type {String}
     */
    static get DETAILS_FILE_NAME() {
        return 'details.json';
    }

    /**
     * The name of the directory for each plugin that contains the public resources
     * @property PUBLIC_DIR_NAME
     * @type {String}
     */
    static get PUBLIC_DIR_NAME() {
        return 'public';
    }

    /**
     * Retrieves the absolute file path to a plugin's public directory
     *
     * @static
     * @method getPublicPath
     * @param pluginDirName The name of the directory that contains the intended
     * plugin
     * @return {string} the absolute file path to a plugin's public directory
     */
    static getPublicPath(pluginDirName) {
        return path.join(PluginUtils.PLUGINS_DIR, pluginDirName, PluginUtils.PUBLIC_DIR_NAME);
    }

    /**
     * Generates a URL path to a public resource for a plugin.
     * @static
     * @method genPublicPath
     * @param {String} plugin The UID of the plugin
     * @param {String} relativePathToMedia The relative path to the resource from
     * the plugin's public directory.
     * @return {String} URL path to the resource
     */
    static genPublicPath(plugin, relativePathToMedia) {
        if (!_.isString(plugin) || !_.isString(relativePathToMedia)) {
            return '';
        }
        return UrlUtils.urlJoin('/public', plugin, relativePathToMedia);
    }
}

module.exports = PluginUtils;
