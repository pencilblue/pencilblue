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
const async = require('async');
const FileUtils = require('../../../../../lib/utils/fileUtils');
const fs = require('fs');
const log = require('../../../../utils/logging').newInstance('PluginResourceLoader');
const path = require('path');
const TaskUtils = require('../../../../../lib/utils/taskUtils');

/**
 * @class PluginResourceLoader
 * @constructor
 * @param {object} context
 * @param {string} context.pluginUid
 */
class PluginResourceLoader {
    constructor(context) {

        /**
         * The identifier for the plugin.  Used in looking up the directory name in the plugins folder
         * @property pluginUid
         * @type {string}
         */
        this.pluginUid = context.pluginUid;

        /**
         * Indicates if the search for resources should be recursive
         * @type {boolean}
         */
        this.recursive = true;
    }

    /**
     * Retrieves all of the resource objects for a plugin as a hash where the derived resource name is the key.
     * @method getAll
     * @param {object} options
     * @param {function} cb (Error, object)
     */
    getAll(options, cb) {
        var self = this;
        var pathToResources = this.getBaseResourcePath();
        fs.exists(pathToResources, function (exists) {
            if (!exists) {
                log.debug('PluginResourceLoader:[%s] No resource directory [%s] was found', pathToResources, self.pluginUid);
                return cb(null, {});
            }

            self._getAll(pathToResources, options, cb);
        });
    }

    /**
     * Creates the tasks to load the resources and then executes them in parallel.
     * @param {string} pathToResources
     * @param {object} options
     * @param {function} cb (Error, object)
     * @private
     */
    _getAll(pathToResources, options, cb) {
        var self = this;
        var tasks = [

            //get the file paths
            TaskUtils.wrapTask(this, this.getResourceFilePaths, [pathToResources]),

            //get resources
            function (resourceFilePaths, callback) {
                async.parallel(self.getLoaderTasks(resourceFilePaths, options), callback);
            }
        ];
        async.waterfall(tasks, PluginResourceLoader.getResultReducer(cb));
    }

    /**
     * Retrieves an array of absolute paths for all of the resource files under the provide path.  The function
     * searches directories recursively
     * @method getResourceFilePaths
     * @param {string} pathToResources
     * @param {function} cb (Error, Array[string])
     */
    getResourceFilePaths(pathToResources, cb) {
        //lookup each resource file path
        var options = {
            recursive: this.recursive,
            filter: this.getFileFilter()
        };

        //TODO [1.0] convert to promise
        FileUtils.getFiles(pathToResources, options).then(function (result) {
            cb(null, result);
        }, cb);
    }

    /**
     * Retrieves a single resource from the file system
     * @method get
     * @param {string} pathToResource
     * @param {object} options
     * @param {function} cb (Error, object)
     */
    get(pathToResource, options, cb) {
        log.silly('PluginResourceLoader:[%s] Attempting to load resource [%s]', this.pluginUid, pathToResource);

        try {
            //parse it and bring it into memory
            var rawResource = require(pathToResource);

            var self = this;
            this.initResource(rawResource, Object.assign.merge({path: pathToResource}, options), function (err, initializedResource) {
                cb(err, {
                    name: self.getResourceName(pathToResource, initializedResource),
                    data: initializedResource
                });
            });
        }
        catch (e) {
            log.error('PluginResourceLoader:[%s] Failed to load resource: [%s]: %s', this.pluginUid, pathToResource, e.stack);
            cb(e, null);
        }
    }

    /**
     * Responsible for initializing the resource.  The default implementation just calls back without modifying or
     * accessing the resource
     * @method initResource
     * @param {function|object|string} resource
     * @param {object} context
     * @param {string} context.path The absolute path to the resource
     * @param {function} cb (Error)
     */
    initResource(resource, context, cb) {
        cb(null, resource);
    }

    /**
     * Derives the unique name of the resource
     * @method getResourceName
     * @param {string} pathToResource
     * @param {object} resource
     * @return {string}
     */
    getResourceName(pathToResource, resource) {
        throw new Error('PluginFileLoader.getResourceName must be overriden by the inheriting prototype');
    }

    /**
     * Creates the function that will be used to filter through the files in the resource directory.  This is most
     * likely a filter by file extension.
     * @method getFileFilter
     * @return {function} (string, object)
     */
    getFileFilter() {
        throw new Error('PluginFileLoader.getFileFilter must be overriden by the inheriting prototype');
    }

    /**
     * Derives the absolute path to the directory that contains all of the resources that are to be loaded
     * @method getBaseResourcePath
     * @return {string}
     */
    getBaseResourcePath() {
        throw new Error('PluginFileLoader.getBaseResourcePath must be overriden by the inheriting prototype');
    }

    /**
     * Creates the tasks (functions) that will be used load all resources for a given plugin
     * @method getLoaderTasks
     * @param {Array} resourceFilePaths
     * @param {object} options
     * @return Array of functions(callback) that call the 'get' function with one of the resource file paths
     */
    getLoaderTasks(resourceFilePaths, options) {
        var self = this;
        return resourceFilePaths.map(function (s) {
            return TaskUtils.wrapTask(self, self.get, [s, options]);
        });
    }

    /**
     * Transforms the array of file wrapper objects into a hash of key/value pairs where the key is the derived name
     * of the resource and the value is the resource prototype/object.
     * @param {function} cb (Error, object)
     * @returns {Function} (Error, Array)
     */
    static getResultReducer(cb) {
        return function (err, resources) {
            var lookup = null;
            if (Array.isArray(resources)) {
                lookup = resources.reduce(function (hash, wrapper) {
                    hash[wrapper.name] = wrapper.data;
                    return hash;
                }, {});
            }
            cb(err, lookup);
        };
    }

    /**
     * Derives the name of a plugin resource.  The function attempts to get
     * the name of the resource by looking to see the file name minus any extension.
     * @static
     * @method getResourceName
     * @param pathToResource The file path to the resource
     * @return {String} The derived resource name
     */
    static getResourceName(pathToResource) {
        var pieces = pathToResource.split(path.sep);
        var name = pieces[pieces.length - 1];

        //strip extension
        var index = name.lastIndexOf('.');
        if (index > 0) {
            name = name.substring(0, index);
        }
        return name;
    }
}

module.exports = PluginResourceLoader;
