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
            self.formError(self.ls.get('EXISTING_TOPIC'), '/admin/content/topics/new_topic', cb);
            return;
        }
        
        var topicDocument = pb.DocumentCreator.create('topic', post);
        dao.update(topicDocument).then(function(result) {
            if(util.isError(result)) {
                self.formError(self.ls.get('ERROR_SAVING'), '/admin/content/topics/new_topic', cb);
                return;
            }
            
            self.session.success = topicDocument.name + ' ' + self.ls.get('CREATED');
            cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/topics/new_topic'));
        });
    });
};

//exports 
module.exports = NewTopic;
