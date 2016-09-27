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
var npm = require('npm');
var semver = require('semver');
var path = require('path');
var fs = require('fs');

module.exports = function (pb) {

    //pb dependencies
    var util = pb.util;
    var PluginService = pb.PluginService;
    var PluginResourceLoader = pb.PluginResourceLoader;
    var RequestHandler = pb.RequestHandler;

    /**
     * @class PluginControllerLoader
     * @extends PluginResourceLoader
     * @constructor
     * @param {object} context
     * @param {string} context.pluginUid
     * @param {string} context.site
     */
    function PluginControllerLoader(context){

        /**
         * @property site
         * @type {string}
         */
        this.site = context.site;

        PluginControllerLoader.super_.call(this, context);
    }
    util.inherits(PluginControllerLoader, PluginResourceLoader);

    /**
     * Responsible for initializing the resource.  Calls the init function after extracting the prototype from the
     * module wrapper function
     * @method initResource
     * @param {function} resource
     * @param {object} context
     * @param {boolean} [context.register=false]
     * @param {function} cb (Error, ControllerPrototype)
     */
    PluginControllerLoader.prototype.initResource = function(resource, context, cb) {
        var ControllerPrototype = resource(pb);
        if (!context.register) {
            return cb(null, ControllerPrototype);
        }

        //we made it this far so we need to register the controller with the RequestHandler
        this.register(ControllerPrototype, context, function(err) {
            cb(err, ControllerPrototype);
        });
    };

    /**
     * Responsible for initializing the resource.  Calls the init function after extracting the prototype from the
     * module wrapper function
     * @method register
     * @param {function} ControllerPrototype
     * @param {object} context
     * @param {string} context.path
     * @param {function} cb (Error)
     */
    PluginControllerLoader.prototype.register = function(ControllerPrototype, context, cb) {
        //ensure we can get the routes
        if (!util.isFunction(ControllerPrototype.getRoutes)){
            return cb(new Error('Controller at [' + context.path + '] does not implement function "getRoutes"'));
        }

        //get the routes
        var self = this;
        ControllerPrototype.getRoutes(function(err, routes) {
            if (util.isError(err)) {
                return cb(err);
            }
            else if (!util.isArray(routes)) {
                return cb(new Error('Controller at [' + context.path + '] did not return an array of routes'));
            }

            //attempt to register route
            for(var i = 0; i < routes.length; i++) {
                var route = routes[i];
                route.controller = context.path;

                //register and verify
                if (!RequestHandler.registerRoute(route, self.pluginUid, self.site)) {
                    pb.log.warn('PluginControllerLoaderService: Failed to register route [%s] for controller at [%s]', util.inspect(route), context.path);
                }
            }

            cb();
        });
    };

    /**
     * Derives the unique name of the resource
     * @method getResourceName
     * @param {string} pathToResource
     * @param {object} resource
     * @return {string}
     */
    PluginControllerLoader.prototype.getResourceName = function(pathToResource/*, resource*/) {
        return pathToResource;
    };

    /**
     * Creates the function that will be used to filter through the files in the resource directory.  This is most
     * likely a filter by file extension.
     * @method getFileFilter
     * @return {function} (string, object)
     */
    PluginControllerLoader.prototype.getFileFilter = function() {
        return util.getFileExtensionFilter('js');
    };

    /**
     * Derives the absolute path to the directory that contains all of the resources that are to be loaded
     * @method getBaseResourcePath
     * @return {string}
     */
    PluginControllerLoader.prototype.getBaseResourcePath = function() {
        return PluginControllerLoader.getPathToControllers(this.pluginUid);
    };

    /**
     * Creates an absolute path pointing to the directory where a plugin's controllers live
     * @static
     * @method getPathToServices
     * @param {string} pluginUid
     * @return {string}
     */
    PluginControllerLoader.getPathToControllers = function(pluginUid) {
        return path.join(PluginService.getPluginsDir(), pluginUid, 'controllers');
    };

    return PluginControllerLoader;
};
