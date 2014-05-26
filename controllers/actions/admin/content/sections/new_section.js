/**
 * NewSection - Creates a new site section
 *    
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function NewSectionController(){}

//dependencies
var EditSectionController = require('./edit_section.js');

//inheritance
util.inherits(NewSectionController, EditSectionController);


NewSectionController.prototype.getObject = function(post, cb) {
	var navItem = pb.DocumentCreator.create('section', post, ['keywords'], ['parent']);
	cb(null, navItem);
};

NewSectionController.prototype.getSuccessMessage = function(navItem) {
	return navItem.name + ' ' + this.ls.get('CREATED');
};

NewSectionController.prototype.getFormLocation = function() {
	return '/admin/content/sections/new_section';
};

//exports
module.exports = NewSectionController;
