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
const log = require('../../../../utils/logging').newInstance('PluginMainModuleLoader');
const path = require('path');
const PluginResourceLoader = require('./plugin_resource_loader');
const PluginUtils = require('../../../../../lib/utils/pluginUtils');

/**
 *
 */
class PluginMainModuleLoader extends PluginResourceLoader {

    /**
     * Attempts to require the main module file for a plugin.
     * @param {String} pluginDirName The name of the directory that the plugin is
     * contained within.
     * @param {String} pathToModule The name of the main module file.  It is also
     * to pass this parameter as the absolute file path to the module.  The
     * function first checks if the parameter is just the file name then checks to
     * see if it is an absolute path.
     * @return {Function} The main-module prototype
     */
    static get (pluginDirName, pathToModule) {
        var pluginMM = path.join(PluginUtils.PLUGINS_DIR, pluginDirName, pathToModule);
        var paths = [pluginMM, pathToModule];

        var mainModule = null;
        for (var i = 0; i < paths.length; i++) {
            try {
                mainModule = require(paths[i]);
                break;
            }
            catch (e) {
                if (log.isDebug()) {
                    log.warn('PluginService: Failed to load main module at %s: %s', paths[i], e.stack);
                }
            }
        }
        return mainModule;
    }
}

module.exports = PluginMainModuleLoader;
