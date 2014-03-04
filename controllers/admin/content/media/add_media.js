/**
 * Media - Interface for managing media
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function AddMedia(){}

//dependencies
var Media = require('../media.js');

//inheritance
util.inherits(AddMedia, pb.BaseController);

AddMedia.prototype.render = function(cb) {
	var self = this;
	
	pb.templates.load('admin/content/media/add_media', '^loc_ADD_MEDIA^', null, function(data) {
        var result = '' + data;
        var tabs   =
        [
            {
                active: 'active',
                href: '#media_upload',
                icon: 'film',
                title: '^loc_LINK_OR_UPLOAD^'
            },
            {
                href: '#topics_dnd',
                icon: 'tags',
                title: '^loc_TOPICS^'
            }
        ];
        
        self.displayErrorOrSuccess(result, function(newResult) {
            result = newResult;
            
            var dao = new pb.DAO();
            dao.query('topic', pb.DAO.ANYWHERE, pb.DAO.PROJECT_ALL, {name: pb.DAO.ASC}).then(function(topics) {
            
                var pills = Media.getPillNavOptions('add_media');
                pills.unshift(
                {
                    name: 'manage_media',
                    title: '^loc_ADD_MEDIA^',
                    icon: 'chevron-left',
                    href: '/admin/content/media/manage_media'
                });
            
                result = result.concat(pb.js.getAngularController(
                {
                    navigation: pb.AdminNavigation.get(self.session, ['content', 'media']),
                    pills: pills,
                    tabs: tabs,
                    topics: topics
                }));
            
                var content = self.localizationService.localize(['admin', 'media'], result);
                cb({content: content});
            });
        });
    });
};

//exports
module.exports = AddMedia;
