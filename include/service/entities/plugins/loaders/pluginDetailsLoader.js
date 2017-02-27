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
const path = require('path');
const PluginResourceLoader = require('./plugin_resource_loader');
const PluginUtils = require('../../../../../lib/utils/pluginUtils');

/**
 *
 */
class PluginDetailsLoader extends PluginResourceLoader {
    constructor(context) {
        super(context);

        //details file are always on top and in the same place.  No need to waste cycles searching
        this.recursive = false;
    }

    /**
     * Retrieves the details file for the plugin
     * @param cb
     */
    getSingle (cb) {
        this.getAll({}, function(err, detailsObjects) {
            cb(err, detailsObjects[0]);
        });
    }

    /**
     * Derives the unique name of the resource
     * @method getResourceName
     * @param {string} pathToResource
     * @param {object} resource
     * @return {string}
     */
    getResourceName(pathToResource, resource) {
        return PluginUtils.DETAILS_FILE_NAME;
    }

    /**
     * Creates the function that will be used to filter through the files in the resource directory.  This is most
     * likely a filter by file extension.
     * @method getFileFilter
     * @return {function} (string, object)
     */
    getFileFilter() {
        return FileUtils.getFileNameFilter(PluginUtils.DETAILS_FILE_NAME);
    }

    /**
     * Derives the absolute path to the directory that contains all of the resources that are to be loaded
     * @method getBaseResourcePath
     * @return {string}
     */
    getBaseResourcePath() {
        return path.join(PluginUtils.PLUGINS_DIR, this.pluginUid);
    }

    /**
     * Constructs the path to a specific plugin's details.json file
     * @static
     * @method getDetailsPath
     * @param {String} pluginDirName The name of the directory that the plugin is
     * contained within.
     * @return {string} The absolute file path to the details.json file for a plugin
     */
    static getDetailsPath(pluginDirName) {
        return path.join(PluginUtils.PLUGINS_DIR, pluginDirName, PluginUtils.DETAILS_FILE_NAME);
    }
}

module.exports = PluginDetailsLoader;
