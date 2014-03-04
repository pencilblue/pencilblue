/**
 * Media - Interface for managing media
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function ManageMedia(){}

//dependencies
var Media = require('../media.js');

//inheritance
util.inherits(ManageMedia, pb.BaseController);

ManageMedia.prototype.render = function(cb) {
	var self = this;
	var dao  = new pb.DAO();
	dao.query('media').then(function(mediaData) {
        if(util.isError(mediaData) || mediaData.length == 0) {
            cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/media/add_media'));
            return;
        }
    
        pb.templates.load('admin/content/media/manage_media', '^loc_MANAGE_MEDIA^', null, function(data) {
           var result = '' + data;
            
            self.displayErrorOrSuccess(result, function(newResult) {
                result = newResult;
                
                var pills = Media.getPillNavOptions('manage_media');
                pills.unshift(
                {
                    name: 'manage_media',
                    title: '^loc_MANAGE_MEDIA^',
                    icon: 'refresh',
                    href: '/admin/content/media/manage_media'
                });
                
                result = result.concat(pb.js.getAngularController(
                {
                    navigation: pb.AdminNavigation.get(self.session, ['content', 'media']),
                    pills: pills,
                    media: Media.formatMedia(mediaData)
                }, [], 'initMediaPagination()'));
                    
                var content = self.localizationService.localize(['admin', 'media'], result);
                cb({content: content});
            });
        });
    });
};

//exports
module.exports = ManageMedia;
