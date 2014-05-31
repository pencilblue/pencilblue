/**
 * NewTopic - Interface for adding a new topic
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function NewTopic(){}

//dependencies
var Topics = require('../topics');

//inheritance
util.inherits(NewTopic, pb.BaseController);

//statics
var SUB_NAV_KEY = 'new_topic';

NewTopic.prototype.render = function(cb) {
	var self = this;
	
	this.setPageName(self.ls.get('NEW_TOPIC'));
	this.ts.load('admin/content/topics/new_topic', function(err, data) {
        var result = ''+data;
        var tabs   =
        [
            {
                active: 'active',
                href: '#topic_settings',
                icon: 'cog',
                title: self.ls.get('SETTINGS')
            }
        ];
            
        var pills = pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, SUB_NAV_KEY);
        result = result.split('^angular_script^').join(pb.js.getAngularController(
        {
            navigation: pb.AdminNavigation.get(self.session, ['content', 'topics'], self.ls),
            pills: pills,
            tabs: tabs
        }));
        
        cb({content: result});
    });
};

NewTopic.getSubNavItems = function(key, ls, data) {
	var pills = Topics.getPillNavOptions();
	pills.unshift(
    {
        name: 'manage_topics',
        title: ls.get('NEW_TOPIC'),
        icon: 'chevron-left',
        href: '/admin/content/topics/manage_topics'
    });
    return pills;
};

//register admin sub-nav
pb.AdminSubnavService.registerFor(SUB_NAV_KEY, NewTopic.getSubNavItems);

//exports
module.exports = NewTopic;
