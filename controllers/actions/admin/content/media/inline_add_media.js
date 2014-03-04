/**
 * AddMedia - Adds new media
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function InlineAddMedia(){}

//dependencies
var AddMedia = require('./add_media.js');

//inheritance
util.inherits(InlineAddMedia, AddMedia);

AddMedia.prototype.onSaveSuccessful = function(mediaDocument) {
	//don't do anything.  We just want to override the default behavior since 
	//we are returning JSON
};

InlineAddMedia.prototype.getRequiredParams = function() {
	return ['media_type', 'location', 'caption'];
};

InlineAddMedia.prototype.getFormErrorRedirect = function(){
	return '/admin/content/media/manage_media';
};

InlineAddMedia.prototype.genReturnVal = function(result) {
	return {
		content: JSON.stringify(result), 
		content_type: 'application/json'
	};
};

//exports
module.exports = InlineAddMedia;
