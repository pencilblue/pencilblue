/**
 * EditPage - Edits an page
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function EditPage(){}

//inheritance
util.inherits(EditPage, pb.FormController);

EditPage.prototype.onPostParamsRetrieved = function(post, cb) {
	var self = this;
	var get  = this.query;
	
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
    
    post['author']       = self.session.user._id.toString();
    post['publish_date'] = new Date(post['publish_date']);
    
    //merge in get params
	pb.utils.merge(this.query, post);
    
	var message = this.hasRequiredParams(post, this.getRequiredParams());
    if(message) {
        this.formError(message, '/admin/content/pages/manage_pages', cb);
        return;
    }
    
    var dao = new pb.DAO();
    dao.loadById('page', post.id, function(err, page) {
        if(util.isError(err) || page == null) {
            self.formError('^loc_ERROR_SAVING^', '/admin/content/pages/manage_pages', cb);
            return;
        }
        
        post['author'] = page['author'];
        var pageDocument = pb.DocumentCreator.update(post, page, ['meta_keywords', 'page_sections', 'page_topics', 'page_media']);
        
        self.setFormFieldValues(post);
        
        var where = {_id: {$ne: page._id}, url: section['url']};
        dao.count('page', where, function(err, count) {
            if(util.isError(err) || count > 0) {
                self.formError('^loc_EXISTING_URL^', '/admin/content/pages/edit_page?id=' + get['id'], cb);
                return;
            }
            
            dao.count('article', {url: pageDocument['url']}, function(err, count) {
                if(util.isError(err) || count > 0) {
                    self.formError('^loc_EXISTING_URL^', '/admin/content/pages', cb);
                    return;
                }
            
                dao.update(page).then(function(result) {
                    if(util.isError(result)) {
                        self.formError('^loc_ERROR_SAVING^', '/admin/content/pages/edit_page?id=' + get['id'], cb);
                        return;
                    }
                    
                    self.session.success = pageDocument.headline + ' ^loc_EDITED^';
                    delete self.session.fieldValues;
                    cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/pages/manage_pages'));
                });
            });
        });
    });
};

EditPage.prototype.getRequiredParams = function() {
	return ['url', 'headline', 'template', 'page_layout', 'id'];
};

EditPage.init = function(request, output)
{
    getSession(request, function(session)
    {
        if(!userIsAuthorized(session, {logged_in: true, admin_level: ACCESS_WRITER}))
        {
            formError(request, session, '^loc_INSUFFICIENT_CREDENTIALS^', '/admin/content/pages/manage_pages', output);
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
        
        
        if(message = checkForRequiredParameters(post, ['url', 'headline', 'template', 'page_layout']))
        {
            formError(request, session, message, '/admin/content/pages/manage_pages', output);
            return;
        }
        if(message = checkForRequiredParameters(get, ['id']))
        {
            formError(request, session, message, '/admin/content/pages/manage_pages', output);
            return;
        }
        
        getDBObjectsWithValues({object_type: 'page', _id: ObjectID(get['id'])}, function(data)
        {
            if(data.length == 0)
            {
                formError(request, session, '^loc_ERROR_SAVING^', '/admin/content/pages/manage_pages', output);
                return;
            }
            
            var page = data[0];
            post['author'] = page['author'];
            var pageDocument = createDocument('page', post, ['meta_keywords', 'page_sections', 'page_topics', 'page_media']);
            
            session = setFormFieldValues(post, session);
            
            getDBObjectsWithValues({object_type: 'page', url: pageDocument['url']}, function(data)
            {
                if(data.length > 0)
                {
                    if(!data[0]._id.equals(page._id))
                    {
                        formError(request, session, '^loc_EXISTING_URL^', '/admin/content/pages/edit_page?id=' + get['id'], output);
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
                            formError(request, session, '^loc_ERROR_SAVING^', '/admin/content/pages/edit_page?id=' + get['id'], output);
                            return;
                        }
                        
                        session.success = pageDocument.headline + ' ^loc_EDITED^';
                        delete session.fieldValues;
                        editSession(request, session, [], function(data)
                        {        
                            output({redirect: pb.config.siteRoot + '/admin/content/pages/manage_pages'});
                        });
                    });
                });
            });
        });
    });
};

//exports
module.exports = EditPage;
