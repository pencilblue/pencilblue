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

//statics
var SUB_NAV_KEY = 'add_media';

AddMedia.prototype.render = function(cb) {
	var self = this;
	
	this.setPageName(self.ls.get('ADD_MEDIA'));
	this.ts.load('admin/content/media/add_media', function(err, data) {
        var result = '' + data;
        var tabs   =
        [
            {
                active: 'active',
                href: '#media_upload',
                icon: 'film',
                title: self.ls.get('LINK_OR_UPLOAD')
            },
            {
                href: '#topics_dnd',
                icon: 'tags',
                title: self.ls.get('TOPICS')
            }
        ];
            
        var dao = new pb.DAO();
        dao.query('topic', pb.DAO.ANYWHERE, pb.DAO.PROJECT_ALL, {name: pb.DAO.ASC}).then(function(topics) {
        
            var pills = pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, 'add_media');            
            var objects = {
                navigation: pb.AdminNavigation.get(self.session, ['content', 'media'], self.ls),
                pills: pills,
                tabs: tabs,
                topics: topics
            };
            result = result.split('^angular_script^').join(pb.js.getAngularController(objects, [], 'initTopicsPagination()'));

            cb({content: result});
        });
    });
};

AddMedia.getSubNavItems = function(key, ls, data) {
	var pills = Media.getPillNavOptions();
    pills.unshift(
    {
        name: 'manage_media',
        title: ls.get('ADD_MEDIA'),
        icon: 'chevron-left',
        href: '/admin/content/media/manage_media'
    });
    return pills;
};

//register admin sub-nav
pb.AdminSubnavService.registerFor(SUB_NAV_KEY, AddMedia.getSubNavItems);

//exports
module.exports = AddMedia;
