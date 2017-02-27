/*
 Copyright (C) 2015  PencilBlue, LLC

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
var Q = require('q');
var FsPromise = require('fs-promise');
var path = require('path');
var PromiseUtils = require('./promiseUtils');

/**
 * File utility functions
 */
class FileUtils {

    /**
     * Retrieves the subdirectories of a path
     * @param {String}   dirPath The starting path
     * @return {Promise}
     */
    static getDirectories (dirPath) {

        var dirs = [];
        return FsPromise.readdir(dirPath).then(function(files) {
            var promises = files.map(function (file) {
                var fullPath = path.join(dirPath, file);
                return FsPromise.stat(fullPath).then(function (stat) {
                    if (stat.isDirectory()) {
                        dirs.push(fullPath);
                    }
                });
            });
            return Q.all(promises).thenResolve(dirs);
        });
    }

    /**
     * Retrieves file and/or directory absolute paths under a given directory path.
     * @param {String} dirPath The path to the directory to be examined
     * @param {Object} [options] Options that customize the results
     * @param {Boolean} [options.recursive=false] A flag that indicates if
     * directories should be recursively searched.
     * @param {Function} [options.filter] A function that returns a boolean
     * indicating if the file should be included in the result set.  The function
     * should take two parameters.  The first is a string value representing the
     * absolute path of the file.  The second is the stat object for the file.
     * @return {Promise}
     */
    static getFiles (dirPath, options) {
        options = options || {};

        //read files from dir
        var filePaths = [];
        return FsPromise.readdir(dirPath).then(function(q) {

            //seed the queue with the absolute paths not just the file names
            for (var i = 0; i < q.length; i++) {
                q[i] = path.join(dirPath, q[i]);
            }

            var condition = function() {
                return q.length > 0;
            };
            var execution = function() {

                var fullPath = q.shift();
                return FsPromise.stat(fullPath).then(function(stat) {

                    //apply filter
                    var meetsCriteria = true;
                    if (typeof options.filter === 'function') {
                        meetsCriteria = options.filter(fullPath, stat);
                    }

                    //examine result and add it when criteria is met
                    if (meetsCriteria) {
                        filePaths.push(fullPath);
                    }

                    //when recursive queue up directory's for processing
                    if (!options.recursive || !stat.isDirectory()) {
                        return;
                    }

                    //read the directory contents and append it to the queue
                    return FsPromise.readdir(fullPath).then(function(childFiles) {
                        Array.prototype.push.apply(q, childFiles.map(function(filePath) {
                            return path.join(fullPath, filePath);
                        }));
                    });
                });
            };
            return PromiseUtils.whilst(condition, execution).thenResolve(filePaths);
        });
    }

    /**
     * Retrieves the extension off of the end of a string that represents a URI to
     * a resource
     * @param {String} filePath URI to the resource
     * @param {Object} [options]
     * @param {Boolean} [options.lower=false] When TRUE the extension will be returned as lower case
     * @param {String} [options.sep] The file path separator used in the path.  Defaults to the OS default.
     * @return {String} The value after the last '.' character
     */
    static getExtension (filePath, options) {
        if (typeof filePath !== 'string' || filePath.length <= 0) {
            return null;
        }
        if (typeof options !== 'object') {
            options = {};
        }

        //do to the end of the path
        var pathPartIndex = filePath.lastIndexOf(options.sep || path.sep) || 0;
        if (pathPartIndex > -1) {
            filePath = filePath.substr(pathPartIndex);
        }

        var ext = null;
        var index = filePath.lastIndexOf('.');
        if (index >= 0) {
            ext = filePath.substring(index + 1);

            //apply options
            if (options.lower) {
                ext = ext.toLowerCase();
            }
        }
        return ext;
    }

    /**
     * Creates a filter function to be used with the getFiles function to skip files that are not of the specified type
     * @param {string} extension
     * @return {function}
     */
    static getFileExtensionFilter (extension) {
        var ext = '.' + extension;
        return FileUtils.getFileNameFilter(ext);
    }

    /**
     *
     * @param filename
     * @returns {Function}
     */
    static getFileNameFilter (filename) {
        return function(fullPath) {
            return fullPath.lastIndexOf(filename) === (fullPath.length - filename.length);
        };
    }
}

module.exports = FileUtils;
