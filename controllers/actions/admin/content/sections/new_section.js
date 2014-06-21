/**
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */

//dependencies
var EditSectionPostController = require('./edit_section.js');

/**
 * NewSection - Creates a new site section
 * @class NewSectionController
 * @constructor
 */
function NewSectionPostController(){}

//inheritance
util.inherits(NewSectionPostController, EditSectionPostController);


NewSectionPostController.prototype.getObject = function(post, cb) {
	var navItem = pb.DocumentCreator.create('section', post, ['keywords'], ['parent']);
	cb(null, navItem);
};

NewSectionPostController.prototype.getSuccessMessage = function(navItem) {
	return navItem.name + ' ' + this.ls.get('CREATED');
};

NewSectionPostController.prototype.getFormLocation = function() {
	return '/admin/content/sections/new_section';
};

//exports
module.exports = NewSectionPostController;
