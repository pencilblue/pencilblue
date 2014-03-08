/**
 * SortObjects - Interface for sorting custom objects
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function SortObjects(){}

//inheritance
util.inherits(SortObjects, pb.FormController);
                   
SortObjects.prototype.onPostParamsRetrieved = function(post, cb) {
	var self = this;
	var vars = this.pathVars;
	
	if(!vars['type_id'])
	{
	    cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/custom_objects/manage_object_types'));
	    return;
	}
	
	var dao = new pb.DAO();
    dao.query('custom_object_type', {_id: ObjectID(vars['type_id'])}).then(function(customObjectTypes) {
		if (util.isError(customObjectTypes)) {
			//TODO handle this
		}
		
		if(customObjectTypes.length == 0)
		{
		    cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/custom_objects/manage_object_types'));
	        return;
		}
		
		var customObjectType = customObjectTypes[0];
	
	    post['custom_object_type'] = vars['type_id'];
	    var sortDocument = pb.DocumentCreator.create('custom_object_sort', post, ['sorted_objects']);
	
	    if(sortDocument.sorted_objects.length == 0)
	    {
	        self.formError('^loc_ERROR_SAVING^', '/admin/content/custom_objects/sort_objects/' + customObjectType.name, cb);
            return;
	    }

        dao.query('custom_object_sort', {custom_object_type: vars['type_id']}).then(function(customObjectSorts) {
		    if (util.isError(customObjectTypes)) {
			    //TODO handle this
		    }
		
		    if(customObjectSorts.length > 0)
		    {
		        sortDocument._id = customObjectSorts[0]._id;
		    }
                
            dao.update(sortDocument).then(function(result) {
                if(util.isError(result)) {
                    self.formError('^loc_ERROR_SAVING^', '/admin/content/custom_objects/sort_objects/' + customObjectType.name, cb);
                    return;
                }
                
                self.session.success = customObjectType.name + ' ^loc_SORT_SAVED^';
                cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/custom_objects/manage_objects/' + customObjectType.name));
            });
        });
    });
};

//exports 
module.exports = SortObjects;
