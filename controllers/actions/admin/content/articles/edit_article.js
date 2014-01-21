/*

    Edits an article
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2014, All rights reserved

*/

this.init = function(request, output)
{
    getSession(request, function(session)
    {
        if(!userIsAuthorized(session, {logged_in: true, admin_level: ACCESS_WRITER}))
        {
            formError(request, session, '^loc_INSUFFICIENT_CREDENTIALS^', '/admin/content/articles/manage_articles', output);
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
        
        if(message = checkForRequiredParameters(post, ['url', 'headline', 'template', 'article_layout']))
        {
            formError(request, session, message, '/admin/content/articles/manage_articles', output);
            return;
        }
        if(message = checkForRequiredParameters(get, ['id']))
        {
            formError(request, session, message, '/admin/content/articles/manage_articles', output);
            return;
        }
        
        getDBObjectsWithValues({object_type: 'article', _id: ObjectID(get['id'])}, function(data)
        {
            if(data.length == 0)
            {
                formError(request, session, '^loc_ERROR_SAVING^', '/admin/content/article/manage_articles', output);
                return;
            }
            
            var article = data[0];
            post['author'] = article['author'];
            var articleDocument = createDocument('article', post, ['meta_keywords', 'article_sections', 'article_topics', 'article_media']);
            
            session = setFormFieldValues(post, session);
            
            getDBObjectsWithValues({object_type: 'article', url: articleDocument['url']}, function(data)
            {
                if(data.length > 0)
                {
                    if(!data[0]._id.equals(article._id))
                    {
                        formError(request, session, '^loc_EXISTING_URL^', '/admin/content/articles/edit_article?id=' + get['id'], output);
                        return;
                    }
                }
                
                getDBObjectsWithValues({object_type: 'page', url: articleDocument['url']}, function(data)
                {
                    if(data.length > 0)
                    {
                        formError(request, session, '^loc_EXISTING_URL^', '/admin/content/articles/edit_article?id=' + get['id'], output);
                        return;
                    }
                
                    editDBObject(article._id, articleDocument, [], function(data)
                    {
                        if(data.length == 0)
                        {
                            formError(request, session, '^loc_ERROR_SAVING^', '/admin/content/articles/edit_article?id=' + get['id'], output);
                            return;
                        }
                        
                        session.success = articleDocument.headline + ' ^loc_EDITED^';
                        delete session.fieldValues;
                        editSession(request, session, [], function(data)
                        {        
                            output({redirect: pb.config.siteRoot + '/admin/content/articles/manage_articles'});
                        });
                    });
                });
            });
        });
    });
}
