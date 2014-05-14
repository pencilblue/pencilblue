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
        ObjectID(get.id);
    }
    catch(error) {
        cb({content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, 'invalid media ID')});
        return;
    }

    var dao = new pb.DAO();
    dao.loadById(get.id, 'media', function(err, mediaObject) {
        if(!mediaObject) {
            cb({content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, 'invalid media ID')});
            return;
        }

        cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, mediaObject.name + ' retrieved', Media.getMediaEmbed(mediaObject))});
        return;
    });
};

//exports
module.exports = GetMediaEmbed;
