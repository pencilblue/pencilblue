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
var npm = require('npm');
var semver = require('semver');
var path = require('path');
var fs = require('fs');

module.exports = function (pb) {

    //pb dependencies
    var util = pb.util;
    var PluginService = pb.PluginService;
    var PluginResourceLoader = pb.PluginResourceLoader;

    /**
     * @class PluginServiceLoader
     * @extends PluginResourceLoader
     * @constructor
     * @param {object} context
     * @param {string} context.pluginUid
     */
    function PluginServiceLoader(context){
        PluginServiceLoader.super_.call(this, context);
    }
    util.inherits(PluginServiceLoader, PluginResourceLoader);

    /**
     * Responsible for initializing the resource.  Calls the init function after extracting the prototype from the
     * module wrapper function
     * @method initResource
     * @param {object} resource
     * @param {object} options
     * @param {function} cb (Error)
     */
    PluginServiceLoader.prototype.initResource = function(resource, options, cb) {
        var service = resource(pb);
        service.init(function(err) {
            cb(err, service);
        });
    };

    /**
     * Derives the unique name of the resource
     * @method getResourceName
     * @param {string} pathToResource
     * @param {object} resource
     * @return {string}
     */
    PluginServiceLoader.prototype.getResourceName = function(pathToResource, resource) {
        return PluginServiceLoader.getServiceName(pathToResource, resource);
    };

    /**
     * Creates the function that will be used to filter through the files in the resource directory.  This is most
     * likely a filter by file extension.
     * @method getFileFilter
     * @return {function} (string, object)
     */
    PluginServiceLoader.prototype.getFileFilter = function() {
        return util.getFileExtensionFilter('js');
    };

    /**
     * Derives the absolute path to the directory that contains all of the resources that are to be loaded
     * @method getBaseResourcePath
     * @return {string}
     */
    PluginServiceLoader.prototype.getBaseResourcePath = function() {
        return PluginServiceLoader.getPathToServices(this.pluginUid);
    };

    /**
     * Creates an absolute path pointing to the directory where a plugin's services live
     * @static
     * @method getPathToServices
     * @param {string} pluginUid
     * @return {string}
     */
    PluginServiceLoader.getPathToServices = function(pluginUid) {
        return path.join(PluginService.getPluginsDir(), pluginUid, 'services');
    };

    /**
     * Derives the name of a plugin service instance.  The function attempts to get
     * the name of the service by looking to see if the service has implemented the
     * getName function.  If it has not then the service name is set to be the file
     * name minus any extension.
     * @static
     * @method getServiceName
     * @param pathToService The file path to the service
     * @param service The service prototype
     * @return {String} The derived service name
     */
    PluginServiceLoader.getServiceName = function(pathToService, service) {
        return service && util.isFunction(service.getName) ? service.getName() : PluginResourceLoader.getResourceName(pathToService);
    };

    return PluginServiceLoader;
};
