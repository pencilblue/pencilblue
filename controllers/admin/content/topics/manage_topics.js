/**
 * Manage Topics - Interface for managing the site's topics via drag and drop
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function ManageTopics() {}

//inheritance
util.inherits(ManageTopics, pb.BaseController);

ManageTopics.prototype.render = function(cb) {
	var self = this;
	var dao  = new pb.DAO();
	dao.query('topic', pb.DAO.ANYWHERE, pb.DAO.PROJECT_ALL, {name: pb.DAO.ASC}).then(function(topics) {
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
    
        pb.templates.load('admin/content/topics/manage_topics', '^loc_MANAGE_TOPICS^', null, function(data) {
            var result = ''+data;
                
            self.displayErrorOrSuccess(result, function(newSession, newResult) {
                result = newResult;
                
                var pills = require('../topics').getPillNavOptions('manage_topics');
                pills.unshift(
                {
                    name: 'manage_topics',
                    title: '^loc_MANAGE_TOPICS^',
                    icon: 'refresh',
                    href: '/admin/content/topics/manage_topics'
                });
                
                result = result.concat(pb.js.getAngularController(
                {
                    navigation: getAdminNavigation(session, ['content', 'topics']),
                    pills: pills,
                    topics: topics
                }, [], 'initTopicsPagination()'));
                
                var content = self.localizationService.localize(['admin', 'topics'], result);
                cb({content: content});
            });
        });
    });
};

ManageTopics.init = function(request, output)
{
    var result = '';
    var instance = this;
    
    getSession(request, function(session)
    {
        if(!userIsAuthorized(session, {logged_in: true, admin_level: ACCESS_EDITOR}))
        {
            output({redirect: pb.config.siteRoot + '/admin'});
            return;
        }
        
        getDBObjectsWithValues({object_type: 'topic'}, function(data)
        {
            if(data.length == 0)
            {                
                output({redirect: pb.config.siteRoot + '/admin/content/topics/new_topic'});
                return;
            }
            
            var topics = data;
            
            topics.sort(function(a, b)
            {
                var x = a['name'].toLowerCase();
                var y = b['name'].toLowerCase();
            
                return ((x < y) ? -1 : ((x > y) ? 1 : 0));
            });
        
            initLocalization(request, session, function(data)
            {
                getHTMLTemplate('admin/content/topics/manage_topics', '^loc_MANAGE_TOPICS^', null, function(data)
                {
                    result = result.concat(data);
                        
                    displayErrorOrSuccess(session, result, function(newSession, newResult)
                    {
                        session = newSession;
                        result = newResult;
                        
                        var pills = require('../topics').getPillNavOptions('manage_topics');
                        pills.unshift(
                        {
                            name: 'manage_topics',
                            title: '^loc_MANAGE_TOPICS^',
                            icon: 'refresh',
                            href: '/admin/content/topics/manage_topics'
                        });
                        
                        result = result.concat(pb.js.getAngularController(
                        {
                            navigation: getAdminNavigation(session, ['content', 'topics']),
                            pills: pills,
                            topics: topics
                        }, [], 'initTopicsPagination()'));
                        
                        editSession(request, session, [], function(data)
                        {
                            output({cookie: getSessionCookie(session), content: localize(['admin', 'topics'], result)});
                        });
                    });
                });
            });
        });
    });
};

//exports
module.exports = ManageTopics;

