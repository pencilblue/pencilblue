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
const FileUtils = require('../../../../../lib/utils/fileUtils');
const fs = require('fs');
const log = require('../../../../utils/logging').newInstance('PluginControllerLoader');
const npm = require('npm');
const path = require('path');
const PluginResourceLoader = require('./plugin_resource_loader');
const PluginUtils = require('../../../../../lib/utils/pluginUtils');
const RouteService = require('../../../../../lib/service/routeService');
const semver = require('semver');
const util = require('util');

/**
 * @class PluginControllerLoader
 * @extends PluginResourceLoader
 * @constructor
 * @param {object} context
 * @param {string} context.pluginUid
 * @param {string} context.site
 */
class PluginControllerLoader extends PluginResourceLoader {
    constructor(context) {

        /**
         * @property site
         * @type {string}
         */
        this.site = context.site;

        super(context);
    }

    /**
     * The name of the directory where controllers are located within a plugin's directory structure
     * @returns {string}
     */
    static get CONTROLLERS_DIR () {
        return 'controllers';
    }

    /**
     * Responsible for initializing the resource.  Calls the init function after extracting the prototype from the
     * module wrapper function
     * @method initResource
     * @param {function} resource
     * @param {object} context
     * @param {boolean} [context.register=false]
     * @param {function} cb (Error, ControllerPrototype)
     */
    initResource(resource, context, cb) {
        var ControllerPrototype = resource;
        if (!context.register) {
            return cb(null, ControllerPrototype);
        }

        //we made it this far so we need to register the controller with the RequestHandler
        this.register(ControllerPrototype, context, function (err) {
            cb(err, ControllerPrototype);
        });
    }

    /**
     * Responsible for initializing the resource.  Calls the init function after extracting the prototype from the
     * module wrapper function
     * @method register
     * @param {function} ControllerPrototype
     * @param {object} context
     * @param {string} context.path
     * @param {function} cb (Error)
     */
    register(ControllerPrototype, context, cb) {
        //ensure we can get the routes
        if (!_.isFunction(ControllerPrototype.getRoutes)) {
            return cb(new Error('Controller at [' + context.path + '] does not implement function "getRoutes"'));
        }

        //get the routes
        var self = this;
        ControllerPrototype.getRoutes(function (err, routes) {
            if (_.isError(err)) {
                return cb(err);
            }
            else if (!Array.isArray(routes)) {
                return cb(new Error('Controller at [' + context.path + '] did not return an array of routes'));
            }

            //attempt to register route
            //TODO [1.0] move route registration out.  Not the responsibility of the loader
            for (var i = 0; i < routes.length; i++) {
                var route = routes[i];
                route.controller = context.path;

                //register and verify
                if (!RouteService.registerRoute(route, self.pluginUid, self.site)) {
                    log.warn('PluginControllerLoaderService: Failed to register route [%s] for controller at [%s]', util.inspect(route), context.path);
                }
            }

            cb();
        });
    }

    /**
     * Derives the unique name of the resource
     * @method getResourceName
     * @param {string} pathToResource
     * @param {object} resource
     * @return {string}
     */
    getResourceName(pathToResource/*, resource*/) {
        return pathToResource;
    }

    /**
     * Creates the function that will be used to filter through the files in the resource directory.  This is most
     * likely a filter by file extension.
     * @method getFileFilter
     * @return {function} (string, object)
     */
    getFileFilter() {
        return FileUtils.getFileExtensionFilter('js');
    }

    /**
     * Derives the absolute path to the directory that contains all of the resources that are to be loaded
     * @method getBaseResourcePath
     * @return {string}
     */
    getBaseResourcePath() {
        return PluginControllerLoader.getPathToControllers(this.pluginUid);
    }

    /**
     * Creates an absolute path pointing to the directory where a plugin's controllers live
     * @static
     * @method getPathToServices
     * @param {string} pluginUid
     * @return {string}
     */
    static getPathToControllers(pluginUid) {
        return path.join(PluginUtils.PLUGINS_DIR, pluginUid, PluginControllerLoader.CONTROLLERS_DIR);
    }
}

module.exports = PluginControllerLoader;
