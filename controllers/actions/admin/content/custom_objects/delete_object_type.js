/**
 * DeleteObjectType - Deletes media
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function DeleteObjectType(){}

//inheritance
util.inherits(DeleteObjectType, pb.FormController);

DeleteObjectType.prototype.onPostParamsRetrieved = function(post, cb) {
    var self = this;
    var get  = this.query;

    var message = this.hasRequiredParams(get, ['id']);
    if(message) {
        this.formError(message, '/admin/content/custom_objects/manage_object_types', cb);
        return;
    }

    var dao = new pb.DAO();
    dao.query('custom_object_type', {_id: ObjectID(get['id'])}).then(function(customObjectTypes) {
        if (util.isError(customObjectTypes)) {
            //TODO handle this
        }

        if(customObjectTypes.length == 0)
        {
            cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/custom_objects/manage_object_types'));
            return;
        }
        
        var customObjectType = customObjectTypes[0];
        
        dao.deleteById(get.id, 'custom_object_type').then(function(recordsDeleted) {
            if(recordsDeleted <= 0) {
                self.formError('^loc_ERROR_SAVING^', '/admin/content/custom_objects/manage_object_types', cb);
                return;
            }

            self.session.success = customObjectType.name + ' ^loc_DELETED^';
            cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/custom_objects/manage_object_types'));
        });
    });
};

//exports
module.exports = DeleteObjectType;
