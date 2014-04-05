/**
 * DeleteObject - Deletes media
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function DeleteObject(){}

//inheritance
util.inherits(DeleteObject, pb.FormController);

DeleteObject.prototype.onPostParamsRetrieved = function(post, cb) {
    var self = this;
    var get  = this.query;

    var message = this.hasRequiredParams(get, ['id']);
    if(message) {
        this.formError(message, '/admin/content/custom_objects/manage_object_types', cb);
        return;
    }

    var dao = new pb.DAO();
    dao.query('custom_object', {_id: ObjectID(get['id'])}).then(function(customObjects) {
        if (util.isError(customObjects)) {
            //TODO handle this
        }

        if(customObjects.length == 0)
        {
            cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/custom_objects/manage_object_types'));
            return;
        }
        
        var customObject = customObjects[0];
        
        dao.query('custom_object_type', {_id: ObjectID(customObject.type)}).then(function(customObjectTypes) {
            if (util.isError(customObjectTypes)) {
                //TODO handle this
            }

            if(customObjectTypes.length == 0)
            {
                cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/custom_objects/manage_object_types'));
                return;
            }
            
            customObjectType = customObjectTypes[0];
            
            dao.deleteById(get.id, 'custom_object').then(function(recordsDeleted) {
                if(recordsDeleted <= 0) {
                    self.formError(self.ls.get('ERROR_SAVING'), '/admin/content/custom_objects/manage_objects/' + customObjectType.name, cb);
                    return;
                }

                self.session.success = customObject.name + ' ' + self.ls.get('DELETED');
                cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/custom_objects/manage_objects/' + customObjectType.name));
            });
        });
    });
};

//exports
module.exports = DeleteObject;
