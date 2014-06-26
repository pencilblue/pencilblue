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

//statics
var SUB_NAV_KEY = 'manage_media';

ManageMedia.prototype.render = function(cb) {
	var self = this;
	var dao  = new pb.DAO();
	dao.query('media').then(function(mediaData) {
        if(util.isError(mediaData) || mediaData.length === 0) {
            cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/media/add_media'));
            return;
        }

        var title = self.ls.get('MANAGE_MEDIA');
        self.setPageName(title);
        self.ts.load('admin/content/media/manage_media', function(err, data) {
           var result = '' + data;

            var pills = pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, 'manage_media');
            result = result.split('^angular_script^').join(pb.js.getAngularController(
            {
                navigation: pb.AdminNavigation.get(self.session, ['content', 'media'], self.ls),
                pills: pills,
                media: Media.formatMedia(mediaData)
            }, [], 'initMediaPagination()'));

            cb({content: result});
        });
    });
};

ManageMedia.getSubNavItems = function(key, ls, data) {
	var pills = Media.getPillNavOptions();
	pills.unshift(
    {
        name: 'manage_media',
        title: ls.get('MANAGE_MEDIA'),
        icon: 'refresh',
        href: '/admin/content/media/manage_media'
    });
    return pills;
};

//register admin sub-nav
pb.AdminSubnavService.registerFor(SUB_NAV_KEY, ManageMedia.getSubNavItems);

//exports
module.exports = ManageMedia;
