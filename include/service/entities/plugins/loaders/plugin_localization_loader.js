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
    var Localization = pb.Localization;

    /**
     * @class PluginLocalizationLoader
     * @extends PluginResourceLoader
     * @constructor
     * @param {object} context
     * @param {string} context.pluginUid
     * @param {string} context.site
     */
    function PluginLocalizationLoader(context){

        /**
         * @property site
         * @type {string}
         */
        this.site = context.site;

        PluginLocalizationLoader.super_.call(this, context);
    }
    util.inherits(PluginLocalizationLoader, PluginResourceLoader);

    /**
     * Responsible for initializing the resource.  Calls the init function after extracting the prototype from the
     * module wrapper function
     * @method initResource
     * @param {function} resource
     * @param {object} context
     * @param {boolean} [context.register=false]
     * @param {function} cb (Error, ControllerPrototype)
     */
    PluginLocalizationLoader.prototype.initResource = function(resource, context, cb) {
        if (!context.register) {
            return cb(null, resource);
        }

        //we made it this far so we need to register the controller with the RequestHandler
        this.register(resource, context, function(err) {
            cb(err, resource);
        });
    };

    /**
     * Responsible for initializing the resource.  Calls the init function after extracting the prototype from the
     * module wrapper function
     * @method register
     * @param {object} localization
     * @param {object} context
     * @param {string} context.path
     * @param {function} cb (Error)
     */
    PluginLocalizationLoader.prototype.register = function(localization, context, cb) {
        var locale = this.getResourceName(context.path, localization);
        pb.log.debug('PluginLocalizationLoader:[%s] Registering localizations for locale [%s]', this.pluginUid, locale);

        var opts = {
            site: this.site,
            plugin: this.pluginUid
        };
        if (!Localization.registerLocale(locale, localization, opts)) {
            pb.log.debug('PluginLocalizationLoader:[%s] Failed to register localizations for locale [%s].  Is the locale supported in your configuration?', this.pluginUid, locale);
        }
        process.nextTick(cb);
    };

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
