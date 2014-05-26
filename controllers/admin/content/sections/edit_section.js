/**
 * EditSection - Input for editing an existing site section
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function EditSection(){}

//dependencies
var AdminNavigation      = pb.AdminNavigation;
var SectionService       = pb.SectionService;
var NewSectionController = require('./new_section.js');

//inheritance
util.inherits(EditSection, NewSectionController);

EditSection.prototype.render = function(cb) {
	var self = this;
	var vars = this.pathVars;
	
	//make sure an ID was passed
    if(!vars['id']) {
        this.reqHandler.serve404();
        return;
    }
    
    EditSection.super_.prototype.render.apply(self, [cb]);
};

EditSection.prototype.getPageName = function() {
	return this.ls.get('EDIT_SECTION');
};

EditSection.prototype.getTemplate = function(cb) {
	var self = this;
	
	this.ts.registerLocal('section_id', this.pathVars.id);
	this.ts.registerLocal('content_type', '{{section.type}}');
	this.ts.registerLocal('selection_id_field', 'item');
	this.ts.registerLocal('content_search_value', function(flag, cb) {
    	if (self.navItem.item) {
    		dao.loadById(self.navItem.item, self.navItem.type, function(err, content) {
    			cb(err, content ? content.headline : '');
    		});
    	}
    	else {
    		cb(null, '');
    	}
    });
	this.ts.load('admin/content/sections/edit_section', cb);
};

EditSection.prototype.getDataTasks = function() {
	var self  = this;
	var tasks = EditSection.super_.prototype.getDataTasks.apply(self, []);
	tasks.section = function(callback) {
		
		var dao = new pb.DAO();
	    dao.loadById(self.pathVars.id, 'section', function(err, section) {
	        if (section) {
	        	section.keywords = section.keywords.join(',');
	        }
	        callback(err, section);
	    });
	};
	return tasks;
};

//exports
module.exports = EditSection;
