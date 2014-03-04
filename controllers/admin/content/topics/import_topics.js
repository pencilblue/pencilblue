/**
 * ImportTopics - Interface for importing topics CSV
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function ImportTopics(){}

//inheritance
util.inherits(ImportTopics, pb.BaseController);

ImportTopics.prototype.render = function(cb) {
	var self = this;
	
	pb.templates.load('admin/content/topics/import_topics', '^loc_NEW_TOPIC^', null, function(data) {
        var result = '' + data;
        var tabs   =
        [
            {
                active: 'active',
                href: '#topic_settings',
                icon: 'file-text-o',
                title: '^loc_LOAD_FILE^'
            }
        ];
        
        self.displayErrorOrSuccess(result, function(newResult) {
            result = newResult;
            
            var pills = require('../topics').getPillNavOptions('import_topics');
            pills.unshift(
            {
                name: 'manage_topics',
                title: '^loc_IMPORT_TOPICS^',
                icon: 'chevron-left',
                href: '/admin/content/topics/manage_topics'
            });
            
            result = result.concat(pb.js.getAngularController(
            {
                navigation: pb.AdminNavigation.get(self.session, ['content', 'topics']),
                pills: pills,
                tabs: tabs
            }));
            
            var content = self.localizationService.localize(['admin', 'topics'], result);
            cb({content: content});
        });
    });
};

//exports
module.exports = ImportTopics;
