/**
 * Manage Topics - Interface for managing the site's topics via drag and drop
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function ManageTopics() {}

//dependencies
var Topics = require('../topics');

//inheritance
util.inherits(ManageTopics, pb.BaseController);

var SUB_NAV_KEY = 'manage_topics';

ManageTopics.prototype.render = function(cb) {
	var self = this;
	var dao  = new pb.DAO();
	dao.query('topic', pb.DAO.ANYWHERE, pb.DAO.PROJECT_ALL).then(function(topics) {
		if (util.isError(topics)) {
			//TODO handle this
		}
		
		//none to manage
        if(topics.length == 0) {                
            cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/topics/new_topic'));
            return;
        }
        
        //currently, mongo cannot do case-insensitive sorts.  We do it manually 
        //until a solution for https://jira.mongodb.org/browse/SERVER-90 is merged.
        topics.sort(function(a, b) {
            var x = a['name'].toLowerCase();
            var y = b['name'].toLowerCase();
        
            return ((x < y) ? -1 : ((x > y) ? 1 : 0));
        });
    
        self.setPageName(self.ls.get('MANAGE_TOPICS'));
        self.ts.load('admin/content/topics/manage_topics', function(err, data) {
            var result = ''+data;
                
            var pills = pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, SUB_NAV_KEY);
            result    = result.split('^angular_script^').join(pb.js.getAngularController(
            {
                navigation: pb.AdminNavigation.get(self.session, ['content', 'topics'], self.ls),
                pills: pills,
                topics: topics
            }, [], 'initTopicsPagination()'));

            cb({content: result});
        });
    });
};

ManageTopics.getSubNavItems = function(key, ls, data) {
	var pills = Topics.getPillNavOptions();
	pills.unshift(
    {
        name: SUB_NAV_KEY,
        title: ls.get('MANAGE_TOPICS'),
        icon: 'refresh',
        href: '/admin/content/topics/manage_topics'
    });
    return pills;
};

//register admin sub-nav
pb.AdminSubnavService.registerFor(SUB_NAV_KEY, ManageTopics.getSubNavItems);

//exports
module.exports = ManageTopics;

