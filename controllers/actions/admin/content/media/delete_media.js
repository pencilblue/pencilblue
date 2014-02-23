/**
 * DeleteMedia - Deletes media
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function DeleteMedia(){}

//inheritance
util.inherits(DeleteMedia, pb.FormController);

DeleteMedia.prototype.onPostParamsRetrieved = function(post, cb) {
	 var self = this;
	 var get  = this.query;
     
	 var message = this.hasRequiredParams(get, ['id']);
     if(message) {
         this.formError(message, '/admin/content/media/manage_media', cb);
         return;
     }
     
     var dao = new pb.DAO();
     dao.deleteById(get.id, 'media').then(function(recordsDeleted) {
         if(recordsDeleted <= 0) {
             self.formError('^loc_ERROR_SAVING^', '/admin/content/media/manage_media', cb);
             return;
         }
         
         session.success = media.name + ' ^loc_DELETED^';
         cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/media/manage_media'));
     });
};

DeleteMedia.init = function(request, output)
{
    var instance = this;

    getSession(request, function(session)
    {
        if(!userIsAuthorized(session, {logged_in: true, admin_level: ACCESS_WRITER}))
        {
            formError(request, session, '^loc_INSUFFICIENT_CREDENTIALS^', '/admin/content/media/manage_media', output);
            return;
        }
        
        var get = getQueryParameters(request);
        
        if(message = checkForRequiredParameters(get, ['id']))
        {
            formError(request, session, message, '/admin/content/media/manage_media', output);
            return;
        }
        
        getDBObjectsWithValues({object_type: 'media', _id: ObjectID(get['id'])}, function(data)
        {
            if(data.length == 0)
            {
                formError(request, session, '^loc_ERROR_SAVING^', '/admin/content/media/manage_media', output);
                return;
            }
            
            var media = data[0];
            
            deleteMatchingDBObjects({object_type: 'media', _id: ObjectID(get['id'])}, function(success)
            {
                session.success = media.name + ' ^loc_DELETED^';
                
                editSession(request, session, [], function(data)
                {        
                    output({redirect: pb.config.siteRoot + '/admin/content/media/manage_media'});
                });
            });
        });
    });
};

//exports
module.exports = DeleteMedia;
