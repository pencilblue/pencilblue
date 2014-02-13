/**
 * NewTopic - Interface for adding a new topic
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function NewTopic(){}

//inheritance
util.inherits(NewTopic, pb.BaseController);

NewTopic.prototype.render = function(cb) {
	var self = this;
	
	pb.templates.load('admin/content/topics/new_topic', '^loc_NEW_TOPIC^', null, function(data) {
        var result = ''+data;
        var tabs   =
        [
            {
                active: 'active',
                href: '#topic_settings',
                icon: 'cog',
                title: '^loc_SETTINGS^'
            }
        ];
        
        self.displayErrorOrSuccess(result, function(newResult) {
            result = newResult;
            
            var pills = require('../topics').getPillNavOptions('new_topic');
            pills.unshift(
            {
                name: 'manage_topics',
                title: '^loc_NEW_TOPIC^',
                icon: 'chevron-left',
                href: '/admin/content/topics/manage_topics'
            });
            
            result = result + pb.js.getAngularController(
            {
                navigation: pb.AdminNavigation.get(self.session, ['content', 'topics']),
                pills: pills,
                tabs: tabs
            });
            
            var content = self.localizationService.localize(['admin', 'topics'], result);
            cb({content: content});
        });
    });
};

NewTopic.init = function(request, output)
{
    var result = '';
    
    getSession(request, function(session)
    {
        if(!userIsAuthorized(session, {logged_in: true, admin_level: ACCESS_EDITOR}))
        {
            output({redirect: pb.config.siteRoot + '/admin'});
            return;
        }
    
        initLocalization(request, session, function(data)
        {
            getHTMLTemplate('admin/content/topics/new_topic', '^loc_NEW_TOPIC^', null, function(data)
            {
                result = result.concat(data);
                
                var tabs =
                [
                    {
                        active: 'active',
                        href: '#topic_settings',
                        icon: 'cog',
                        title: '^loc_SETTINGS^'
                    }
                ];
                
                displayErrorOrSuccess(session, result, function(newSession, newResult)
                {
                    session = newSession;
                    result = newResult;
                    
                    var pills = require('../topics').getPillNavOptions('new_topic');
                    pills.unshift(
                    {
                        name: 'manage_topics',
                        title: '^loc_NEW_TOPIC^',
                        icon: 'chevron-left',
                        href: '/admin/content/topics/manage_topics'
                    });
                    
                    result = result.concat(pb.js.getAngularController(
                    {
                        navigation: getAdminNavigation(session, ['content', 'topics']),
                        pills: pills,
                        tabs: tabs
                    }));
                    
                    editSession(request, session, [], function(data)
                    {
                        output({cookie: getSessionCookie(session), content: localize(['admin', 'topics'], result)});
                    });
                });
            });
        });
    });
};

//exports
module.exports = NewTopic;
