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
var path = require('path');

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
    function PluginPublicContentController(){}
    util.inherits(PluginPublicContentController, BaseController);

    /**
     * @see BaseController.render
     * @method render
     * @param {Function} cb
     */
    PluginPublicContentController.prototype.render = function(cb) {
        var plugin          = this.pathVars.plugin;
        var postPluginPath  = this.pathVars.path;
        var pluginPublicDir = PluginService.getActivePluginPublicDir(plugin);
        var publicRoutes = ['js/', 'css/', 'fonts/', 'img/', 'localization/', 'favicon.ico', 'docs/', 'dist/'];

        //do check for valid strings otherwise serve 404
        if (!util.isString(postPluginPath) || !util.isString(pluginPublicDir)) {
            pb.log.silly('PluginPublicContentController: Invalid public path was provided. POST_PLUGIN_PATH=[%s] PLUGIN_PUBLIC_DIR=[%s] URL=[%s]', postPluginPath, pluginPublicDir, this.req.url);
            this.reqHandler.serve404();
            return;
        }

        //serve up the content
        //mitigates path traversal attacks by using path.normalize to resolve any
        //directory changes (./ and ../) and verifying that the path has one of
        //the prefixes in publicRoutes
        var normalized = path.normalize(postPluginPath).replace(/^(\.\.[\/\\])+/, '');
        
        if (publicRoutes.some(prefix => normalize.startsWith(prefix))) {
            var fullpath = path.join(pluginPublicDir, normalized);
            
            //remove qsvars before loading files
            this.reqHandler.servePublicContent(fullpath.split('?')[0]);
        } else {
            this.reqHandler.serve404();
            return;
        }
    };

    //exports
    return PluginPublicContentController;
};
