/**
 * NewTopic - Interface for adding a new topic
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function NewTopic(){}

//inheritance
util.inherits(NewTopic, pb.FormController);
                   
NewTopic.prototype.onPostParamsRetrieved = function(post, cb) {
	var self    = this;
	var message = this.hasRequiredParams(post, ['name']);
	if(message) {
        this.formError(message, '/admin/content/topics/new_topic', cb);
        return;
    }

    var dao = new pb.DAO();
    dao.count('topic', {name: post.name}, function(err, count) {
        if(count > 0) {
            self.formError('^loc_EXISTING_TOPIC^', '/admin/content/topics/new_topic', cb);
            return;
        }
        
        var topicDocument = pb.DocumentCreator.create('topic', post);
        dao.update(topicDocument).then(function(result) {
            if(util.isError(result)) {
                self.formError('^loc_ERROR_SAVING^', '/admin/content/topics/new_topic', cb);
                return;
            }
            
            self.session.success = topicDocument.name + ' ^loc_CREATED^';
            cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/topics/new_topic'));
        });
    });
};

this.init = function(request, output)
{
    getSession(request, function(session)
    {
        if(!userIsAuthorized(session, {logged_in: true, admin_level: ACCESS_EDITOR}))
        {
            formError(request, session, '^loc_INSUFFICIENT_CREDENTIALS^', '/admin/content/topics/new_topic', output);
            return;
        }
    
        var post = getPostParameters(request);
        
        if(message = checkForRequiredParameters(post, ['name']))
        {
            formError(request, session, message, '/admin/content/topics/new_topic', output);
            return;
        }
        
        var topicDocument = createDocument('topic', post);
        
        getDBObjectsWithValues({object_type: 'topic', name: topicDocument['name']}, function(data)
        {
            if(data.length > 0)
            {
                formError(request, session, '^loc_EXISTING_TOPIC^', '/admin/content/topics/new_topic', output);
                return;
            }
            
            createDBObject(topicDocument, function(data)
            {
                if(data.length == 0)
                {
                    formError(request, session, '^loc_ERROR_SAVING^', '/admin/content/topics/new_topic', output);
                    return;
                }
                
                session.success = topicDocument.name + ' ^loc_CREATED^';
                
                editSession(request, session, [], function(data)
                {        
                    output({redirect: pb.config.siteRoot + '/admin/content/topics/new_topic'});
                });
            });
        });
    });
};

//exports 
module.exports = NewTopic;
