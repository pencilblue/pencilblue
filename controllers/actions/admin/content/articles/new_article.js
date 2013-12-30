/*

    Creates a new article
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2013, All rights reserved

*/

this.init = function(request, output)
{
    getSession(request, function(session)
    {
        if(!userIsAuthorized(session, {logged_in: true, admin_level: ACCESS_WRITER}))
        {
            formError(request, session, '^loc_INSUFFICIENT_CREDENTIALS^', '/admin/content/articles', output);
            return;
        }
    
        var post = getPostParameters(request);
        
        delete post['section_search'];
        delete post['topic_search'];
        delete post['media_search'];
        delete post['media_url'];
        delete post['media_type'];
        delete post['location'];
        delete post['thumb'];
        delete post['media_topics'];
        delete post['name'];
        delete post['caption'];
        delete post['layout_link_url'];
        delete post['media_position'];
        delete post['media_max_height'];
        
        post['author'] = session['user']._id.toString();
        post['publish_date'] = new Date(post['publish_date']);
        
        if(message = checkForRequiredParameters(post, ['url', 'template', 'article_layout']))
        {
            formError(request, session, message, '/admin/content/articles', output);
            return;
        }
        
        var articleDocument = createDocument('article', post, ['meta_keywords', 'article_sections', 'article_topics', 'article_media']);
        
        getDBObjectsWithValues({object_type: 'article', url: articleDocument['url']}, function(data)
        {
            if(data.length > 0)
            {
                formError(request, session, '^loc_EXISTING_URL^', '/admin/content/articles', output);
                return;
            }
            
            createDBObject(articleDocument, function(data)
            {
                if(data.length == 0)
                {
                    formError(request, session, '^loc_ERROR_SAVING^', '/admin/content/articles', output);
                    return;
                }
                
                session.success = '^loc_ARTICLE_CREATED^';
                editSession(request, session, [], function(data)
                {        
                    output({redirect: pb.config.siteRoot + '/admin/content/articles'});
                });
            });
        });
    });
}
