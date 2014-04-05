/**
 * DeleteController - Deletes Objects
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function DeleteController(){}

//inheritance
util.inherits(DeleteController, pb.FormController);

DeleteController.prototype.onPostParamsRetrieved = function(post, cb) {
	var self = this;
	var get  = this.query;
    
	//merge get and post in case ID was a query string param
	pb.utils.merge(get, post);
	
	//check for the required parameters
	var message = this.hasRequiredParams(post, this.getRequiredFields());
    if(message) {
        this.formError(message, this.getFormErrorRedirect(null, message), cb);
        return;
    }
    
    //create the tasks & execute in order
    var tasks = [
         function(callback){
        	 self.canDelete(function(err, canDelete){
        		 
        		 var error = null;
        		 if (util.isError(err)) {
        			 error = err;
        		 }
        		 else if (!canDelete) {
        			 error = canDelete;
        		 }
        		 callback(error, canDelete);
        	 });
         },
         function(callback){
        	 self.onBeforeDelete(callback);
         },
         function(callback){
        	 var dao = new pb.DAO();
    	     dao.deleteMatching(self.getDeleteQuery(), self.getDeleteCollection()).then(function(result) {
    	        if(util.isError(result) || result <= 0) {
    	            callback(result, result);
    	        }
    	        else{
    	        	callback(null, result);
    	        }
    	    });
         },
         function(callback){
        	 self.onAfterDelete(callback);
         },
    ];
    async.series(tasks, function(err, results){
    	
    	//process the results
    	if (err != null) {
    		self.onError(err, null, cb);
    	}
    	else {
    		cb(self.getDataOnSuccess(results));
    	}
    });
};

DeleteController.prototype.getRequiredFields = function () {
	return ['id'];
};

DeleteController.prototype.canDelete = function(cb) {
	cb(null, true);
};

DeleteController.prototype.onBeforeDelete = function(cb) {
	cb(null, true);
};

DeleteController.prototype.onAfterDelete = function(cb) {
	cb(null, true);
};

DeleteController.prototype.getDeleteQuery = function() {
	return pb.DAO.getIDWhere(this.query.id);
};

DeleteController.prototype.onError = function(err, message, cb) {
	if (message == undefined || message == null) {
		message = this.getDefaultErrorMessage();
	}
	self.formError(message, this.getFormErrorRedirect(err, message), cb);
};

DeleteController.prototype.getFormErrorRedirect = function(err, message) {
	return '/';
};

DeleteController.prototype.getDeleteCollection = function() {
	return 'IS NOT IMPLEMENTED';
};

DeleteController.prototype.getSuccessRedirect = function() {
	return pb.config.siteRoot;
};

DeleteController.prototype.getDataOnSuccess = function(results) {
	return pb.RequestHandler.generateRedirect(this.getSuccessRedirect());
};

DeleteController.prototype.getDefaultErrorMessage = function() {
	return this.ls.get('ERROR_SAVING');
};

//exports
module.exports.DeleteController = DeleteController;
