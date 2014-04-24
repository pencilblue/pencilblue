/**
 * DeleteSection - Deletes a site topic
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function DeleteTopic(){}

//inheritance
util.inherits(DeleteTopic, pb.BaseController);

DeleteTopic.prototype.render = function(cb) {
	var self    = this;
	var vars    = this.pathVars;
	
	var message = this.hasRequiredParams(vars, ['id']);
	if (message) {
        this.formError(message, '/admin/content/topics/manage_topics', cb);
        return;
    }
    
	//ensure existence
	var dao = new pb.DAO();
	dao.loadById(vars['id'], 'topic', function(err, topic) {
        if(topic == null) {
            self.formError(self.ls.get('ERROR_SAVING'), '/admin/content/topics/manage_topics', cb);
            return;
        }
        
        //delete the topic
        var where = {$or: [{_id: ObjectID(vars['id'])}, {parent: vars['id']}]};
        dao.deleteMatching({_id: ObjectID(vars['id'])}, 'topic').then(function(result) {
        	if(result < 1) {
                self.formError(self.ls.get('ERROR_SAVING'), '/admin/content/topics/manage_topics', cb);
                return;
            }
        	
            self.session.success = topic.name + ' ' + self.ls.get('DELETED');
            cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/topics/manage_topics'));
        });
    });
};

//exports
module.exports = DeleteTopic;
