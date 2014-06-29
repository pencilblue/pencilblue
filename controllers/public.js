/*
    Copyright (C) 2014  PencilBlue, LLC

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

/**
 * Loads files in the public folder
 */

function PluginPublicContentController(){}

//dependencies
var PluginService  = pb.PluginService;
var BaseController = pb.BaseController;

//inheritance
util.inherits(PluginPublicContentController, BaseController);


PluginPublicContentController.prototype.render = function(cb) {
	var plugin          = this.pathVars.plugin;
	var pathParts       = this.req.url.split('/');
	pathParts.splice(0, 3);

	var postPluginPath  = pathParts.join(path.sep);
	var pluginPublicDir = PluginService.getActivePluginPublicDir(plugin);
	var resourcePath    = path.join(pluginPublicDir, postPluginPath);
	this.reqHandler.servePublicContent(resourcePath);
};

//exports
module.exports = PluginPublicContentController;
