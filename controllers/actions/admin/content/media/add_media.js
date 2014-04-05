/**
 * AddMedia - Adds new media
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function AddMedia(){}

//inheritance
util.inherits(AddMedia, pb.FormController);

AddMedia.prototype.onPostParamsRetrieved = function(post, cb) {
	var self = this;
	
	delete post['topic_search'];
    
	var message = this.hasRequiredParams(post, this.getRequiredParams());
    if(message) {
        this.formError(message, this.getFormErrorRedirect(), cb);
        return;
    }
    
    var mediaDocument = pb.DocumentCreator.create('media', post, ['media_topics'], ['is_file']);
    var dao = new pb.DAO();
    dao.update(mediaDocument).then(function(result) {
        if (util.isError(result)) {
            self.formError(self.ls.get('ERROR_SAVING'), self.getFormErrorRedirect(), cb);
            return;
        }
        
        self.onSaveSuccessful(mediaDocument);
        cb(self.genReturnVal(result));
    });
};

AddMedia.prototype.onSaveSuccessful = function(mediaDocument) {
	self.session.success = mediaDocument.name + ' ' + self.ls.get('ADDED');
};

AddMedia.prototype.getRequiredParams = function() {
	return ['media_type', 'location', 'name', 'caption'];
};

AddMedia.prototype.getFormErrorRedirect = function(){
	return '/admin/content/media/add_media';
};

AddMedia.prototype.genReturnVal = function(result) {
	return pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/media/add_media');
};

//exports
module.exports = AddMedia;
