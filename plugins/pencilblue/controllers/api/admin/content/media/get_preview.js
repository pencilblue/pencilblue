/*
    Copyright (C) 2014  PencilBlue, LLC

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/**
 * Returns the HTML for a media preview
 */
function GetMediaPreview(){}

//inheritance
util.inherits(GetMediaPreview, pb.BaseController);

GetMediaPreview.prototype.render = function(cb) {
    var self = this;
    var get  = this.query;

    //validate request
    if (!pb.validation.isIdStr(get.id, true) && !pb.validation.isStr(get.location, true)) {
        return cb({
            code: 400,
            content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, message)
        });
    }

    //retrieve rendering
    var props = {
        'max-width': '100%',
        'max-height': '300px',
        class: 'img-responsive'
    };
    var ms = new pb.MediaService();
    if (get.id) {
        ms.renderById(get.id, props, function(err, html) {
            self.renderComplete(err, html, cb);
        });
    }
    else if (get.location && get.type){
        
        var options = {
            location: get.location,
            type: get.type,
            props: props
        };
        ms.renderByLocation(options, function(err, html) {
            self.renderComplete(err, html, cb);
        });
    }
    else {
        this.renderComplete(null, null, cb);
    }
};

GetMediaPreview.prototype.renderComplete = function(err, html, cb) {
    if (util.isError(err)) {
        return this.reqHandler.serveError(err);
    }
    else if (!html) {
        return cb({
            code: 400,
            content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, this.ls.get('UNSUPPORTED_MEDIA'))
        });
    }

    cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, '', html)});
};

GetMediaPreview.prototype.getPreviewById = function(id, ms, cb) {
    var self = this;
    
    
    var dao = new pb.DAO();
    dao.loadById(id, 'media', function(err, media) {
        if(util.isError(err)) {
            return self.reqHandler.serveError(err);
        }
        else if (!media) {
            return cb({
                code: 404,
                content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('OBJECT_NOT_FOUND'))
            });
        }

        ms.renderById(id, function(err, html) {
            self.renderComplete(err, html);
        });
    });
};

GetMediaPreview.prototype.getPreviewByType = function(type, location, cb) {
    var self = this;
    var responsiveEmbed = '<div class="embed-responsive embed-responsive-16by9">^iframe^</div>';
    var preview;

    switch(type) {
        case 'image':
            preview = '<img class="img-responsive" src="' + location + '" style="max-width: 100%; max-height: 300px"/>';
            break;
        case 'video/mp4':
        case 'video/webm':
        case 'video/ogg':
            preview = responsiveEmbed.split('^iframe^').join('<video src="' + location + '"></video>');
            break;
        case 'youtube':
            preview = responsiveEmbed.split('^iframe^').join('<iframe class="embed-responsive-item" src="//www.youtube.com/embed/' + location + '"></iframe>');
            break;
        case 'vimeo':
            preview = responsiveEmbed.split('^iframe^').join('<iframe class="embed-responsive-item" src="//player.vimeo.com/video/' + location + '"></iframe>');
            break;
        case 'daily_motion':
            preview = responsiveEmbed.split('^iframe^').join('<iframe class="embed-responsive-item" src="http://www.dailymotion.com/embed/video/' + location + '"></iframe>');
            break;
        case 'vine':
            preview = responsiveEmbed.split('^iframe^').join('<iframe class="embed-responsive-item" src="https://vine.co/v/' + location + '/embed/simple"></iframe>');
            break;
        case 'instagram':
            preview = responsiveEmbed.split('^iframe^').join('<iframe class="embed-responsive-item" src="//instagram.com/p/' + location + '/embed/"></iframe>');
            break;
        case 'slideshare':
            preview = responsiveEmbed.split('^iframe^').join('<iframe class="embed-responsive-item" src="http://www.slideshare.net/slideshow/embed_code/' + location + '"></iframe>');
            break;
        case 'trinket':
            preview = responsiveEmbed.split('^iframe^').join('<iframe class="embed-responsive-item" src="https://trinket.io/embed/' + location + '"></iframe>');
            break;
        case 'storify':
            preview = responsiveEmbed.split('^iframe^').join('<iframe class="embed-responsive-item" src="//storify.com/' + location + '/embed?header=false&border=false"></iframe>');
            break;
        case 'kickstarter':
            preview = responsiveEmbed.split('^iframe^').join('<iframe class="embed-responsive-item" src="https://www.kickstarter.com/' + location + '/widget/video.html" scrolling="no"></iframe>');
            break;
        default:
            cb({content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('UNSUPPORTED_MEDIA'))});
            return;
    }

    cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, '', preview)});
};

//exports
module.exports = GetMediaPreview;
