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
const path = require('path');
const fs = require('fs');
const mime = require('mime');

module.exports = function PluginPublicContentControllerModule(pb) {

    //PB dependencies
    var util           = pb.util;
    var PluginService  = pb.PluginService;
    var BaseController = pb.BaseController;

    /**
     * Loads files in a plugin's public folder
     * @class PluginPublicContentController
     * @constructor
     * @extends BaseController
     */
    class PluginPublicContentController extends pb.BaseController{
        render (cb) {
            let plugin          = this.pathVars.plugin;
            let postPluginPath  = this.pathVars.path;
            let pluginPublicDir = PluginService.getActivePluginPublicDir(plugin);
            let publicRoutes = ['angular/', 'js/', 'css/', 'fonts/', 'img/', 'images/', 'localization/', 'favicon.ico', 'dist/', 'widgets/', 'version/'];

            //do check for valid strings otherwise serve 404
            if (!util.isString(postPluginPath) || !util.isString(pluginPublicDir)) {
                pb.log.silly('PluginPublicContentController: Invalid public path was provided. POST_PLUGIN_PATH=[%s] PLUGIN_PUBLIC_DIR=[%s] URL=[%s]', postPluginPath, pluginPublicDir, this.req.url);
                throw new pb.Errors.notFound();
            }

            //serve up the content
            //mitigates path traversal attacks by using path.normalize to resolve any
            //directory changes (./ and ../) and verifying that the path has one of
            //the prefixes in publicRoutes
            let normalizedpath = path.normalize(postPluginPath).replace(/^(\.\.[\/\\])+/, '');

            if (publicRoutes.some(prefix => normalizedpath.startsWith(prefix))) {
                let fullpath = path.join(pluginPublicDir, normalizedpath);

                //remove qsvars before loading files
                this._servePublicContent(fullpath.split('?')[0], cb);
            } else {
                pb.log.error('PluginPublicContentController: Path is not a valid public directory. NORMALIZED_POST_PLUGIN_PATH=[%s] PLUGIN_PUBLIC_DIR=[%s] URL=[%s]', normalizedpath, pluginPublicDir, this.req.url);

                throw new pb.Errors.forbidden('Path is not a valid public directory.');
            }
        }
        _servePublicContent(absolutePath, cb) {
            //check for provided path, then default if necessary
            if (!absolutePath) {
                absolutePath = path.join(pb.config.docRoot, 'public', this.url.pathname);
            }
            fs.readFile(absolutePath, (err, content) => {
                if (err) {
                    throw new pb.Errors.notFound(err.message);
                }
                cb({
                    content: content,
                    content_type: mime.lookup(absolutePath)
                });
            });
        }
    }

    //exports
    return PluginPublicContentController;
};
