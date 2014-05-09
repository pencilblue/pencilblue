/**
 * Gets an embed tag for the supplied media ID
 *
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function GetMediaEmbed(){}

//dependencies
var Media = require('../../../include/theme/media');

//inheritance
util.inherits(GetMediaEmbed, pb.FormController);

GetMediaEmbed.prototype.render = function(cb) {
    var self = this;
    var get = this.query;

    var message = this.hasRequiredParams(get, ['id']);
    if(message) {
        cb({content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, 'id is missing from URL')});
        return;
    }

    try {
        ObjectID(get['id']);
    }
    catch(error) {
        cb({content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, 'invalid media ID')});
        return;
    }

    var dao = new pb.DAO();
    dao.loadById(get['id'], 'media', function(err, mediaObject) {
        if(!mediaObject) {
            cb({content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, 'invalid media ID')});
            return;
        }

        cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, mediaObject.name + ' retrieved', self.getEmbedTag(mediaObject))});
        return;
    });
};

GetMediaEmbed.prototype.getEmbedTag = function(mediaObject) {
    switch(mediaObject.media_type) {
        case 'image':
            return '<img class="img-responsive" src="' + mediaObject.location + '" style="^media_style^"/>';

        case 'youtube':
            return '<iframe width="560" height="315" src="//www.youtube.com/embed/' + mediaObject.location + '" frameborder="0" allowfullscreen></iframe>';

        case 'vimeo':
            return '<iframe src="//player.vimeo.com/video/' + mediaObject.location + '" width="500" height="281" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>';

        case 'daily_motion':
            return '<iframe frameborder="0" width="480" height="270" src="http://www.dailymotion.com/embed/video/' + mediaObject.location + '"></iframe>';

        case 'vine':
            return '<iframe class="vine-embed" src="https://vine.co/v/' + mediaObject.location + '/embed/simple" width="400" height="400"  frameborder="0"></iframe>';

        case 'instagram':
            return '<iframe src="//instagram.com/p/' + mediaObject.location + '/embed/" width="400" height="475" frameborder="0" scrolling="no" allowtransparency="true"></iframe>';
        case 'slideshare':
            return '<iframe src="http://www.slideshare.net/slideshow/embed_code/' + mediaObject.location + '" width="427" height="356" frameborder="0" marginwidth="0" marginheight="0" scrolling="no" allowfullscreen></iframe>';
        case 'trinket':
            return '<iframe src="https://trinket.io/embed/python/' + mediaObject.location + '" width="600" height="400" frameborder="0" marginwidth="0" marginheight="0" allowfullscreen></iframe>';
    }

    return '';
};

//exports
module.exports = GetMediaEmbed;
