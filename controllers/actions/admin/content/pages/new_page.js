/**
 * NewPage - Creates a new page
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function NewPage(){}

//inheritance
util.inherits(NewPage, pb.FormController);

NewPage.prototype.onPostParamsRetrieved = function(post, cb) {
	var self = this;
	
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
    
    post['author']       = self.session.authentication.user_id;
    post['publish_date'] = new Date(post['publish_date']);
    
    this.session = this.setFormFieldValues(post);
    
    var message = this.hasRequiredParams(post, ['url', 'headline', 'template', 'page_layout']);
    if(message) {
        this.formError(message, '/admin/content/pages/new_page', cb);
        return;
    }
    
    var pageDocument = pb.DocumentCreator.create('page', post, ['meta_keywords', 'page_topics', 'page_media']);
    var dao          = new pb.DAO();
    dao.count('page', {url: pageDocument['url']}, function(err, count) {
        if(util.isError(err) || count > 0) {
            self.formError('^loc_EXISTING_URL^', '/admin/content/pages/new_page', output);
            return;
        }
        
        dao.count('article', {url: pageDocument['url']}, function(err, count) {
        	if(util.isError(err) || count > 0) {
                self.formError('^loc_EXISTING_URL^', '/admin/content/pages/new_page', cb);
                return;
            }            
        
        	dao.update(pageDocument).then(function(result) {
                if(util.isError(result)) {
                    self.formError('^loc_ERROR_SAVING^', '/admin/content/pages/new_page', cb);
                    return;
                }
                
                self.session.success = pageDocument.headline + ' ^loc_CREATED^';
                delete self.session.fieldValues;
                cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/pages/manage_pages'));
            });
        });
    });
};

NewPage.init = function(request, output)
{
    getSession(request, function(session)
    {
        if(!userIsAuthorized(session, {logged_in: true, admin_level: ACCESS_EDITOR}))
        {
            formError(request, session, '^loc_INSUFFICIENT_CREDENTIALS^', '/admin/content/pages/new_page', output);
            return;
        }
    
        var post = getPostParameters(request);
        
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
            formError(request, session, message, '/admin/content/pages/new_page', output);
            return;
        }
        
        var pageDocument = createDocument('page', post, ['meta_keywords', 'page_topics', 'page_media']);
        
        getDBObjectsWithValues({object_type: 'page', url: pageDocument['url']}, function(data)
        {
            if(data.length > 0)
            {
                formError(request, session, '^loc_EXISTING_URL^', '/admin/content/pages/new_page', output);
                return;
            }
            
            getDBObjectsWithValues({object_type: 'article', url: pageDocument['url']}, function(data)
            {
            
                if(data.length > 0)
                {
                    formError(request, session, '^loc_EXISTING_URL^', '/admin/content/pages/new_page', output);
                    return;
                }            
            
                createDBObject(pageDocument, function(data)
                {
                    if(data.length == 0)
                    {
                        formError(request, session, '^loc_ERROR_SAVING^', '/admin/content/pages/new_page', output);
                        return;
                    }
                    
                    session.success = pageDocument.headline + ' ^loc_CREATED^';
                    delete session.fieldValues;
                    editSession(request, session, [], function(data)
                    {        
                        output({redirect: pb.config.siteRoot + '/admin/content/pages/manage_pages'});
                    });
                });
            });
        });
    });
};

//exports
module.exports = NewPage;
