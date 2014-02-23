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
            self.formError('^loc_ERROR_SAVING^', self.getFormErrorRedirect(), cb);
            return;
        }
        
        self.onSaveSuccessful(mediaDocument);
        cb(self.genReturnVal(result));
    });
};

AddMedia.prototype.onSaveSuccessful = function(mediaDocument) {
	self.session.success = mediaDocument.name + ' ^loc_ADDED^';
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

AddMedia.init = function(request, output)
{
    getSession(request, function(session)
    {
        if(!userIsAuthorized(session, {logged_in: true, admin_level: ACCESS_WRITER}))
        {
            formError(request, session, '^loc_INSUFFICIENT_CREDENTIALS^', '/admin/content/media/add_media', output);
            return;
        }
    
        var post = getPostParameters(request);
        delete post['topic_search'];
        
        if(message = checkForRequiredParameters(post, ['media_type', 'location', 'name', 'caption']))
        {
            formError(request, session, message, '/admin/content/media/add_media', output);
            return;
        }
        
        var mediaDocument = createDocument('media', post, ['media_topics'], ['is_file']);
        
        createDBObject(mediaDocument, function(data)
        {
            if(data.length == 0)
            {
                formError(request, session, '^loc_ERROR_SAVING^', '/admin/content/media/add_media', output);
                return;
            }
            
            session.success = mediaDocument.name + ' ^loc_ADDED^';
            editSession(request, session, [], function(data)
            {        
                output({redirect: pb.config.siteRoot + '/admin/content/media/add_media'});
            });
        });
    });
};

//exports
module.exports = AddMedia;
