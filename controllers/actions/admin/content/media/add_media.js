/*

    Adds new media
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2013, All rights reserved

*/

this.init = function(request, output)
{
    getSession(request, function(session)
    {
        if(!userIsAuthorized(session, {logged_in: true, admin_level: ACCESS_WRITER}))
        {
            formError(request, session, '^loc_INSUFFICIENT_CREDENTIALS^', '/admin/content/media', output);
            return;
        }
    
        var post = getPostParameters(request);
        delete post['topic_search'];
        
        if(message = checkForRequiredParameters(post, ['media_type', 'location', 'caption']))
        {
            formError(request, session, message, '/admin/content/media', output);
            return;
        }
        
        var mediaDocument = createDocument('media', post, ['media_topics'], ['is_file']);
        
        createDBObject(mediaDocument, function(data)
        {
            if(data.length == 0)
            {
                formError(request, session, '^loc_ERROR_SAVING^', '/admin/content/media', output);
                return;
            }
            
            session.success = '^loc_MEDIA_ADDED^';
            editSession(request, session, [], function(data)
            {        
                output({redirect: pb.config.siteRoot + '/admin/content/media'});
            });
        });
    });
}
