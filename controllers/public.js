/**
 * Page - Responsible for looking up a specific page and rendering it.
 * 
 * @author Brian Hyder <brian@pencilblue.org>
 * @copyright PencilBlue, LLC. 2014 All Rights Reserved
 */
function PluginPublicContentController(){}

//dependencies
var PluginService  = pb.PluginService;
var BaseController = pb.BaseController;

//inheritance 
util.inherits(PluginPublicContentController, BaseController);


PluginPublicContentController.prototype.render = function(cb) {console.log('here');
	var plugin = this.pathVars.plugin;
	
	var pathParts       = this.url.pathname.split('/');
	var postPluginPath  = pathParts.splice(0, 2).join(path.sep);
	var pluginPublicDir = PluginService.getActivePluginPublicDir(plugin);
	var resourcePath    = path.join(pluginPublicDir, postPluginPath);
	this.reqHandler.serverPublicContent(resourcePath);
};

//exports
module.exports = PluginPublicContentController;