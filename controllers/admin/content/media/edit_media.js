/**
 * Media - Interface for managing media
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function EditMedia(){}

//dependencies
var Media = require('../media.js');

//inheritance
util.inherits(EditMedia, pb.BaseController);

EditMedia.prototype.render = function(cb) {
	var self = this;
	var vars = this.pathVars;
	
	//make sure an ID was passed
    if(!vars['id']) {
        cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/media/manage_media'));
        return;
    }
    
    var dao = new pb.DAO();
    dao.loadById(vars['id'], 'media', function(err, media) {
        if(media == null) {
        	cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/media/manage_media'));
            return;
        }
	
	    self.setPageName(self.ls.get('EDIT') + ' ' + media.name);
	    self.ts.load('admin/content/media/edit_media', function(err, data) {
            var result = '' + data;
            var tabs   =
            [
                {
                    active: 'active',
                    href: '#media_upload',
                    icon: 'film',
                    title: self.ls.get('SETTINGS')
                },
                {
                    href: '#topics_dnd',
                    icon: 'tags',
                    title: self.ls.get('TOPICS')
                }
            ];
                
            var dao = new pb.DAO();
            dao.query('topic', pb.DAO.ANYWHERE, pb.DAO.PROJECT_ALL, {name: pb.DAO.ASC}).then(function(topics) {
            
                var pills = Media.getPillNavOptions('add_media');
                pills.unshift(
                {
                    name: 'manage_media',
                    title: self.getPageName(),
                    icon: 'chevron-left',
                    href: '/admin/content/media/manage_media'
                });
                
                var objects = {
                    navigation: pb.AdminNavigation.get(self.session, ['content', 'media'], self.ls),
                    pills: pills,
                    tabs: tabs,
                    media: media,
                    topics: topics
                };
                
                self.session.fieldValues = {media_topics: media.media_topics.join(',')};
                self.checkForFormRefill(result, function(newResult) {
	                result = newResult;
                
                    result = result.split('^media_id^').join(media._id);
                    result = result.split('^angular_script^').join(pb.js.getAngularController(objects, [], 'getMediaEmbed(' + JSON.stringify(media) + ');initTopicsPagination()'));

                    cb({content: result});
                });
            });
        });
    });
};

//exports
module.exports = EditMedia;
