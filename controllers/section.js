/**
 * Article - Responsible for looking up a specific article and rendering it.
 * 
 * @author Brian Hyder <brian@pencilblue.org>
 * @copyright PencilBlue, LLC. 2014 All Rights Reserved
 */
function Section(){}

//dependencies
var Index = require('./index.js');

//inheritance 
util.inherits(Section, Index);


Section.prototype.render = function(cb) {
	var self    = this;
	var custUrl = this.pathVars.customUrl;
	var dao     = new pb.DAO();
	dao.loadByValue('url', custUrl, 'section', function(err, section) {
		if (util.isError(err) || section == null) {
			cb({content: 'The section could not be found on this server', code: 404});
			return;
		}
		
		self.req.pencilblue_section = section._id.toString();
		this.section = section; 
		Section.super_.prototype.render.apply(self, [cb]);
	});
};

Section.prototype.getPageTitle = function() {
	return section.name;
};

//exports
module.exports = Section;