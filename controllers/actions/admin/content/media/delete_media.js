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
    var vars = this.pathVars;

    var message = this.hasRequiredParams(vars, ['id']);
    if(message) {
        this.formError(message, '/admin/content/media/manage_media', cb);
        return;
    }
     
    var dao = new pb.DAO();
    dao.query('media', {_id: ObjectID(vars['id'])}).then(function(mediaData) {
        if(util.isError(mediaData) || mediaData.length == 0) {
            self.formError(self.ls.get('ERROR_SAVING'), '/admin/content/media/manage_media', cb);
            return;
        }
        
        dao.deleteById(vars['id'], 'media').then(function(recordsDeleted) {
            if(recordsDeleted <= 0) {
                self.formError(self.ls.get('ERROR_SAVING'), '/admin/content/media/manage_media', cb);
                return;
            }

            self.session.success = mediaData[0].name + ' ' + self.ls.get('DELETED');
            cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/media/manage_media'));
        });
    });
}

//exports
module.exports = DeleteMedia;
