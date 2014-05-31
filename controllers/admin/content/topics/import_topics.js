/**
 * Interface for importing topics CSV
 * 
 * @class ImportTopics
 * @constuctor
 * @extends BaseController
 * @module Controllers
 * @submodule Admin
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function ImportTopics(){}

//var dependencies
var Topics = require('../topics');

//inheritance
util.inherits(ImportTopics, pb.BaseController);

//statics
var SUB_NAV_KEY = 'import_topics';

/**
 * @method render
 * @see BaseController.render()
 * @param cb
 */
ImportTopics.prototype.render = function(cb) {
	var self = this;
	
	this.setPageName(this.ls.get('NEW_TOPIC'));
	this.ts.load('admin/content/topics/import_topics', function(err, result) {
        var tabs   =
        [
            {
                active: 'active',
                href: '#topic_settings',
                icon: 'file-text-o',
                title: self.ls.get('LOAD_FILE')
            }
        ];
            
        var pills = pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, 'manage_topics');
        result    = result.split('^angular_script^').join(pb.js.getAngularController(
        {
            navigation: pb.AdminNavigation.get(self.session, ['content', 'topics'], self.ls),
            pills: pills,
            tabs: tabs
        }));

        cb({content: result});
    });
};

ImportTopics.getSubNavItems = function(key, ls, data) {
	var pills = Topics.getPillNavOptions();
    pills.unshift(
    {
        name: 'manage_topics',
        title: ls.get('IMPORT_TOPICS'),
        icon: 'chevron-left',
        href: '/admin/content/topics/manage_topics'
    });
    return pills;
};

//register admin sub-nav
pb.AdminSubnavService.registerFor(SUB_NAV_KEY, ImportTopics.getSubNavItems);

//exports
module.exports = ImportTopics;
