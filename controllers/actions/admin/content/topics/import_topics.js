/**
 * ImportTopics - Imports topics CSV
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function ImportTopics(){}

//inheritance
util.inherits(ImportTopics, pb.BaseController);

ImportTopics.prototype.render = function(cb) {
	var self  = this;
	var files = [];
    
    var form = new formidable.IncomingForm();
    form.on('file', function(field, file)
    {
        files.push(file);
    });
    form.parse(this.req, function() {
    	//TODO handle error, max size, etc.
    	
        fs.readFile(files[0].path, function(err, data) {
            if(util.isError(err)) {
                self.formError(self.ls.get('ERROR_SAVING'), '/admin/content/topics/import_topics', cb);
                return;
            }
            
            var topics = data.toString().split(',');
            self.saveTopics(topics, cb);
        });
    });
};

ImportTopics.prototype.saveTopics = function(topics, cb) {
    var content = {completed: false};
    
    //create tasks
    var dao = new pb.DAO();
    var tasks = pb.utils.getTasks(topics, function(topicArry, index) {
    	return function(callback) {
    		
    		dao.count('topic', {name: topicArry[index].trim()}, function(err, count){
    			if (count > 0) {
    				callback(null, true);
    				return;
    			}
    			
    			var topicDocument = pb.DocumentCreator.create('topic', {name: topicArry[index].trim()});
    			dao.update(topicDocument).then(function(result){
    				if (util.isError(result)) {
    					callback(result, null);
    					return;
    				}
    				callback(null, result);
    			});
    		});
    		
    	};
    });
    
    //execute in parallel
    async.parallelLimit(tasks, 3, function(err, results){
    	content.completed = !util.isError(err);
    	cb({content: JSON.stringify(content), content_type: 'application/json'});
    });
};

//exports
module.exports = ImportTopics;
