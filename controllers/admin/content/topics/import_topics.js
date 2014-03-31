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

/**
 * @method render
 * @see BaseController.render()
 * @param cb
 */
ImportTopics.prototype.render = function(cb) {
	var self = this;
	
	this.setPageName(this.ls.get('NEW_TOPIC'));
	this.ts.load('admin/content/topics/import_topics', function(err, data) {
        var result = '' + data;
        var tabs   =
        [
            {
                active: 'active',
                href: '#topic_settings',
                icon: 'file-text-o',
                title: self.ls.get('LOAD_FILE')
            }
        ];
        
        self.displayErrorOrSuccess(result, function(newResult) {
            result = newResult;
            
            var pills = Topics.getPillNavOptions('import_topics');
            pills.unshift(
            {
                name: 'manage_topics',
                title: self.ls.get('IMPORT_TOPICS'),
                icon: 'chevron-left',
                href: '/admin/content/topics/manage_topics'
            });
            
            result = result.concat(pb.js.getAngularController(
            {
                navigation: pb.AdminNavigation.get(self.session, ['content', 'topics'], self.ls),
                pills: pills,
                tabs: tabs
            }));

            cb({content: result});
        });
    });
};

//exports
module.exports = ImportTopics;
