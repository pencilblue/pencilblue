/**
 * Pages administration page
 * @author Blake Callens <blake.callens@gmail.com>
 * @copyright PencilBlue 2013, All rights reserved
 */
function Sections(){}

//dependencies
var BaseController = pb.BaseController;

//inheritance
util.inherits(Sections, BaseController);

Sections.prototype.render = function(cb) {
	this.redirect(pb.config.siteRoot + '/admin/content/sections/section_map', cb);
};

//exports
module.exports = Sections;