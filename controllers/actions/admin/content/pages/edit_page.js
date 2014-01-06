/*

    Edits an page
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2014, All rights reserved

*/

this.init = function(request, output)
{
    getSession(request, function(session)
    {
        if(!userIsAuthorized(session, {logged_in: true, admin_level: ACCESS_WRITER}))
        {
            formError(request, session, '^loc_INSUFFICIENT_CREDENTIALS^', '/admin/content/pages', output);
            return;
        }
        
        var get = getQueryParameters(request);
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
        
        session = setFormFieldValues(post, session);
        
        if(message = checkForRequiredParameters(post, ['url', 'headline', 'template', 'page_layout']))
        {
            formError(request, session, message, '/admin/content/pages', output);
            return;
        }
        if(message = checkForRequiredParameters(get, ['id']))
        {
            formError(request, session, message, '/admin/content/pages', output);
            return;
        }
        
        getDBObjectsWithValues({object_type: 'page', _id: ObjectID(get['id'])}, function(data)
        {
            if(data.length == 0)
            {
                formError(request, session, '^loc_ERROR_SAVING^', '/admin/content/page', output);
                return;
            }
            
            var page = data[0];
            post['author'] = page['author'];
            var pageDocument = createDocument('page', post, ['meta_keywords', 'page_sections', 'page_topics', 'page_media']);
            
            getDBObjectsWithValues({object_type: 'page', url: pageDocument['url']}, function(data)
            {
                if(data.length > 0)
                {
                    if(!data[0]._id.equals(page._id))
                    {
                        formError(request, session, '^loc_EXISTING_URL^', '/admin/content/pages', output);
                        return;
                    }
                }
                
                getDBObjectsWithValues({object_type: 'article', url: pageDocument['url']}, function(data)
                {
                    if(data.length > 0)
                    {
                        formError(request, session, '^loc_EXISTING_URL^', '/admin/content/pages', output);
                        return;
                    }
                
                    editDBObject(page._id, pageDocument, [], function(data)
                    {
                        if(data.length == 0)
                        {
                            formError(request, session, '^loc_ERROR_SAVING^', '/admin/content/pages', output);
                            return;
                        }
                        
                        session.success = pageDocument.headline + ' ^loc_EDITED^';
                        delete session.fieldValues;
                        editSession(request, session, [], function(data)
                        {        
                            output({redirect: pb.config.siteRoot + '/admin/content/pages'});
                        });
                    });
                });
            });
        });
    });
}
