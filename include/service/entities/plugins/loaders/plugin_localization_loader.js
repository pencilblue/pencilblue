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
"use strict";

//dependencies
var path = require('path');

module.exports = function (pb) {

    //pb dependencies
    var util = pb.util;
    var PluginService = pb.PluginService;
    var PluginResourceLoader = pb.PluginResourceLoader;

    /**
     * @class PluginLocalizationLoader
     * @extends PluginResourceLoader
     * @constructor
     * @param {object} context
     * @param {string} context.pluginUid
     */
    function PluginLocalizationLoader(context){
        PluginLocalizationLoader.super_.call(this, context);
    }
    util.inherits(PluginLocalizationLoader, PluginResourceLoader);

    /**
     * Derives the unique name of the resource
     * @method getResourceName
     * @param {string} pathToResource
     * @param {object} resource
     * @return {string}
     */
    PluginLocalizationLoader.prototype.getResourceName = function(pathToResource, resource) {
        return PluginResourceLoader.getResourceName(pathToResource);
    };

    /**
     * Creates the function that will be used to filter through the files in the resource directory.  This is most
     * likely a filter by file extension.
     * @method getFileFilter
     * @return {function} (string, object)
     */
    PluginLocalizationLoader.prototype.getFileFilter = function() {
        return util.getFileExtensionFilter('json');
    };

    /**
     * Derives the absolute path to the directory that contains all of the resources that are to be loaded
     * @method getBaseResourcePath
     * @return {string}
     */
    PluginLocalizationLoader.prototype.getBaseResourcePath = function() {
        return PluginLocalizationLoader.getPathToLocalizations(this.pluginUid);
    };

    /**
     * Creates an absolute path pointing to the directory where a plugin's localizations live
     * @static
     * @method getPathToServices
     * @param {string} pluginUid
     * @return {string}
     */
    PluginLocalizationLoader.getPathToLocalizations = function(pluginUid) {
        return path.join(PluginService.getPublicPath(pluginUid), 'localization');
    };

    return PluginLocalizationLoader;
};
