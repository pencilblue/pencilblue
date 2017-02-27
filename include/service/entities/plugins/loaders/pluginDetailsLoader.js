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
const FileUtils = require('../../../../../lib/utils/fileUtils');
const fs = require('fs');
const path = require('path');
const PluginResourceLoader = require('./plugin_resource_loader');
const PluginUtils = require('../../../../../lib/utils/pluginUtils');

/**
 *
 */
class PluginDetailsLoader {

    /**
     * @param {string} pluginUid
     * @return {object}
     */
    static load (pluginUid) {
        var detailsFilePath = PluginDetailsLoader.getDetailsPath(pluginUid);
        
        //attempt to parse the json
        var detailsObj = null;
        try {
            detailsObj = require(detailsFilePath);
        }
        catch (e) {
            if (log.isDebug()) {
                log.warn('Failed to load details file at %s: %s', detailsFilePath, e.stack);
            }
        }
        return detailsObj;
    }

    /**
     * Constructs the path to a specific plugin's details.json file
     * @param {String} pluginDirName The name of the directory that the plugin is contained within.
     * @return {string} The absolute file path to the details.json file for a plugin
     */
    static getDetailsPath(pluginDirName) {
        return path.join(PluginUtils.PLUGINS_DIR, pluginDirName, PluginUtils.DETAILS_FILE_NAME);
    }
}

module.exports = PluginDetailsLoader;
