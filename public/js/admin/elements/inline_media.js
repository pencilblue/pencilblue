var siteRoot;
var saveMediaURL;
var mediaItemTemplate = '<div id="media_^media_id^" class="col-md-3 media_item"><div class="panel panel-info"><div class="panel-heading"><div style="font-size: 1.5em"><i class="fa fa-bars"></i>&nbsp;^media_icon^&nbsp;<a href="javascript:window.open(\'^media_link^\', \'_blank\')"><i class="fa fa-eye" style="float: right; margin-right: .5em;"></i></a></div> <div class="media_name">^media_name^</div></div><div class="panel-footer"><span class="media_caption">^media_caption^</span></div></div></div>';

$(document).ready(function()
{
    $('#media .col-md-3').draggable({revert: 'invalid', containment: 'document', helper: 'clone', cursor: 'move'});
    $('#active_media').droppable({accept: '#media .col-md-3', drop: function(event, ui)
    {
        $('#active_media').append(ui.draggable);
    }});
    $('#inactive_media').droppable({accept: '#media .col-md-3', drop: function(event, ui)
    {
        $('#inactive_media').append(ui.draggable);
    }});
    
    new jNarrow('#media_search', '#inactive_media .media_item',
    {
        searchChildElement: '.media_name',
        searchButton: '#media_search_button',
        searchText: '<i class="fa fa-search"></i>',
        clearText: '<i class="fa fa-times"></i>',
    });
});

function setupUpload(root)
{
    siteRoot = root;
    saveMediaURL = siteRoot + '/actions/admin/content/media/inline_add_media';

    $(function() 
    {
        'use strict';
        // Change this to the location of your server-side upload handler:
        var url = siteRoot + '/actions/admin/content/media/upload_media';
        $('#media_file').fileupload(
        {
            url: url,
            dataType: 'json',
            done: function(error, data)
            {
                $('#upload_progress').hide();
                validateMediaURL(data.result.filename, true);
            },
            progressall: function (error, data)
            {
                $('#upload_progress').show();
                var progress = parseInt(data.loaded / data.total * 100, 10);
                $('#upload_progress .progress-bar').css(
                    'width',
                    progress + '%'
                );
            }
        }).prop('disabled', !$.support.fileInput).parent().addClass($.support.fileInput ? undefined : 'disabled');
    });
}

function showMediaModal(subsection)
{
    $('#media_display').html('');
    $('#link_to_media').hide();
    $('#upload_media').hide();
    $(subsection).show();
    
    $('#media_modal').modal({backdrop: 'static', keyboard: true});
}

function validateMediaURL(mediaURL, isFile)
{
    if(mediaURL.length == 0)
    {
        return;
    }
    
    var fileType = mediaURL.substr(mediaURL.lastIndexOf('.') + 1);
    
    switch(fileType)
    {
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
        case 'svg':
            setMediaValues(isFile, 'image', mediaURL);
            previewImage(mediaURL);
            return;
        case 'mp4':
            setMediaValues(isFile, 'video/mp4', mediaURL);
            previewHTML5Video(mediaURL, 'video/mp4');
            return;
        case 'webm':
            setMediaValues(isFile, 'video/webm', mediaURL);
            previewHTML5Video(mediaURL, 'video/webm');
            return;
        case 'ogv':
            setMediaValues(isFile, 'video/ogg', mediaURL);
            previewHTML5Video(mediaURL, 'video/ogg');
            return;
        default:
            break;
    }
    
    if(mediaURL.indexOf('youtube.com') != -1)
    {
        if(mediaURL.indexOf('v=') != -1)
        {
            var videoID = mediaURL.substr(mediaURL.indexOf('v=') + 2);
            if(videoID.indexOf('&') != -1)
            {
                videoID = videoID.substr(0, videoID.indexOf('&'));
            }
            setMediaValues(isFile, 'youtube', videoID);
            previewYouTube(videoID);
        }
    }
    else if(mediaURL.indexOf('youtu.be') != -1)
    {
        if(mediaURL.indexOf('/') != -1)
        {
            var videoID = mediaURL.substr(mediaURL.lastIndexOf('/') + 1);
            if(videoID.indexOf('&') != -1)
            {
                videoID = videoID.substr(0, videoID.indexOf('&'));
            }
            setMediaValues(isFile, 'youtube', videoID);
            previewYouTube(videoID);
        }
    }
    else if(mediaURL.indexOf('vimeo.com') != -1)
    {
        if(mediaURL.indexOf('/') != -1)
        {
            var videoID = mediaURL.substr(mediaURL.lastIndexOf('/') + 1);
            if(videoID.indexOf('&') != -1)
            {
                videoID = videoID.substr(0, videoID.indexOf('&'));
            }
            setMediaValues(isFile, 'vimeo', videoID);
            previewVimeo(videoID);
        }
    }
    else if(mediaURL.indexOf('dailymotion.com/video/') != -1)
    {
        var videoID = mediaURL.substr(mediaURL.lastIndexOf('/') + 1);
        if(videoID.indexOf('&') != -1)
        {
            videoID = videoID.substr(0, videoID.indexOf('&'));
        }
        setMediaValues(isFile, 'daily_motion', videoID);
        previewDailyMotion(videoID);
    }
    else if(mediaURL.indexOf('dai.ly') != -1)
    {
        if(mediaURL.indexOf('/') != -1)
        {
            var videoID = mediaURL.substr(mediaURL.lastIndexOf('/') + 1);
            if(videoID.indexOf('&') != -1)
            {
                videoID = videoID.substr(0, videoID.indexOf('&'));
            }
            setMediaValues(isFile, 'daily_motion', videoID);
            previewDailyMotion(videoID);
        }
    }
}

function setMediaValues(isFile, type, location)
{
    $('#is_file').prop('checked', isFile);
    $('#media_type').val(type);
    $('#location').val(location);
    $('#link_loading').show();
    getMediaThumb(type, location, function(thumb)
    {
        $('#link_loading').hide();
        $('#thumb').val(thumb);
        $('#save_button').removeAttr('disabled');
    });
}

function getMediaThumb(type, location, output)
{
    switch(type)
    {
        case 'image':
        case 'video/mp4':
        case 'video/webm':
        case 'video/ogg':
            output(location);
            break;
        case 'youtube':
            output('http://img.youtube.com/vi/' + location + '/0.jpg');
            break;
        case 'vimeo':
            $.getJSON('http://vimeo.com/api/v2/video/' + location + '.json', function(data)
            {
                output(data[0].thumbnail_medium);
            });
            break;
        case 'daily_motion':
            output('http://www.dailymotion.com/thumbnail/video/' + location);
            break;
        default:
            return '';
            break;
    }
}

function previewImage(mediaURL)
{
    $('#media_display').html('<img src="' + mediaURL + '" style="max-height: 200px;"></img>');
}

function previewHTML5Video(mediaURL, codec)
{
    $('#media_display').html('<video style="max-height: 300px;" controls><source src="' + mediaURL + '" type="' + codec + '"></video>');
}

function previewYouTube(videoID)
{
    $('#media_display').html('<iframe width="420" height="315" src="//www.youtube.com/embed/' + videoID + '" frameborder="0" allowfullscreen></iframe>');
}

function previewVimeo(videoID)
{
    $('#media_display').html('<iframe src="//player.vimeo.com/video/' + videoID + '" width="500" height="281" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>');
}

function previewDailyMotion(videoID)
{
    $('#media_display').html('<iframe frameborder="0" width="480" height="270" src="http://www.dailymotion.com/embed/video/' + videoID + '"></iframe>');
}

// Saving -----------------------------------

function checkForAddMediaSave()
{
    buildTopics(function(topicsCSV)
    {
        if(!$('#media_topics').position())
        {
            $('#add_media_form fieldset').append('<input type="text" id="media_topics" name="media_topics" value="' + topicsCSV + '" style="display: none"></input>');
        }
        else
        {
            $('#media_topics').val(topicsCSV);
        }
        
        $.post(saveMediaURL, $('.modal-body fieldset').serialize(), function(data)
        {
            var newMedia = JSON.parse(data);
            
            var mediaItemElement = mediaItemTemplate.split('^media_id^').join(newMedia._id.toString());
            mediaItemElement = mediaItemElement.split('^media_name^').join(newMedia.name);
            mediaItemElement = mediaItemElement.split('^media_icon^').join(getMediaIcon(newMedia.media_type));
            mediaItemElement = mediaItemElement.split('^media_caption^').join(newMedia.caption);
            mediaItemElement = mediaItemElement.split('^media_link^').join(getMediaLink(newMedia.media_type, newMedia.location, newMedia.is_file));
            
            $('#active_media').append(mediaItemElement);
            $('#media_modal').modal('hide');
        });
    });
}

function getMediaIcon(mediaType)
{
    var iconID = '';

    switch(mediaType)
    {
        case 'image':
            iconID = 'picture-o';
            break;
        case 'video/mp4':
        case 'video/webm':
        case 'video/ogg':
            iconID = 'film';
            break;
        case 'youtube':
            iconID = 'youtube';
            break;
        case 'vimeo':
            iconID = 'vimeo-square';
            break;
        case 'daily_motion':
            iconID = 'play-circle-o';
            break;
        default:
            iconID = 'question';
            break;
    }
    
    return '<i class="fa fa-' + iconID + '"></i>';
}

function getMediaLink(mediaType, mediaLocation, isFile)
{
    switch(mediaType)
    {
        case 'youtube':
            return 'http://youtube.com/watch/?v=' + mediaLocation;
        case 'vimeo':
            return 'http://vimeo.com/' + mediaLocation;
        case 'daily_motion':
            return 'http://dailymotion.com/video/' + mediaLocation;
        case 'image':
        case 'video/mp4':
        case 'video/webm':
        case 'video/ogg':
        default:
            if(isFile)
            {
                return siteRoot + mediaLocation;
            }
            return mediaLocation;
    }
}
