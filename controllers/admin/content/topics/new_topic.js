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
            
        var pills = Topics.getPillNavOptions('new_topic');
        pills.unshift(
        {
            name: 'manage_topics',
            title: self.getPageName(),
            icon: 'chevron-left',
            href: '/admin/content/topics/manage_topics'
        });
        
        result = result + pb.js.getAngularController(
        {
            navigation: pb.AdminNavigation.get(self.session, ['content', 'topics'], self.ls),
            pills: pills,
            tabs: tabs
        });
        
        cb({content: result});
    });
};

//exports
module.exports = NewTopic;
