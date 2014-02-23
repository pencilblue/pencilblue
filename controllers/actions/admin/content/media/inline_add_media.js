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

InlineAddMedia.init = function(request, output)
{
    getSession(request, function(session)
    {
        if(!userIsAuthorized(session, {logged_in: true, admin_level: ACCESS_WRITER}))
        {
            formError(request, session, '^loc_INSUFFICIENT_CREDENTIALS^', '/admin/content/media/manage_media', output);
            return;
        }
    
        var post = getPostParameters(request);
        delete post['topic_search'];
        
        if(message = checkForRequiredParameters(post, ['media_type', 'location', 'caption']))
        {
            formError(request, session, message, '/admin/content/media/manage_media', output);
            return;
        }
        
        var mediaDocument = createDocument('media', post, ['media_topics'], ['is_file']);
        
        createDBObject(mediaDocument, function(data)
        {
            if(data.length == 0)
            {
                formError(request, session, '^loc_ERROR_SAVING^', '/admin/content/media/manage_media', output);
                return;
            }
                    
            output({content: JSON.stringify(data)});
        });
    });
};

//exports
module.exports = InlineAddMedia;
