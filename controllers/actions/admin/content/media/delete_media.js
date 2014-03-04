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

//exports
module.exports = DeleteMedia;
