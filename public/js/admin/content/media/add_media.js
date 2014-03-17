/*

    Interface for adding
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2013, All rights reserved

*/

$(document).ready(function()
{
    $('#add_media_form').validate(
    {
        rules:
        {
            caption:
            {
                minlength: 2,
                required: true
            }
        }
    });
});

function setupUpload(siteRoot)
{
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
    $('#link_to_media').hide();
    $('#upload_media').hide();
    $(subsection).show();
    
    $('#media_modal').modal({backdrop: 'static', keyboard: true});
}

function validateMediaURL(mediaURL, isFile)
{
    if(mediaURL.length == 0)
    {
        $('#media_modal').modal('hide');
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
    else if(mediaURL.indexOf('vine.co') != -1)
    {
        var mediaURL = mediaURL.split('/embed').join('');
        var videoID = mediaURL.substr(mediaURL.lastIndexOf('/') + 1);
        if(videoID.indexOf('&') != -1)
        {
            videoID = videoID.substr(0, videoID.indexOf('&'));
        }
        setMediaValues(isFile, 'vine', videoID);
        previewVine(videoID);
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
        $('#media_modal').modal('hide');
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
        case 'vine':
            output('');
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
    $('#media_display').html('<iframe src="//player.vimeo.com/video/' + videoID + '" width="480" height="280" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>');
}

function previewDailyMotion(videoID)
{
    $('#media_display').html('<iframe frameborder="0" width="480" height="270" src="http://www.dailymotion.com/embed/video/' + videoID + '"></iframe>');
}

function previewVine(videoID)
{
    $('#media_display').html('<iframe class="vine-embed" src="https://vine.co/v/' + videoID + '/embed/simple" width="300" height="300"  frameborder="0"></iframe>');
}

// Saving -----------------------------------

function checkForAddMediaSave()
{
    buildTopics(function(topicsCSV)
    {
        if(!$('#media_topics').position())
        {
            $('fieldset').append('<input type="text" id="media_topics" name="media_topics" value="' + topicsCSV + '" style="display: none"></input>');
        }
        else
        {
            $('#media_topics').val(topicsCSV);
        }
        
        $('#add_media_form').submit();
    });
}

function buildTopics(output)
{
    var topicElements = $('#active_topics').find('.topic');
    topicElementCount = 0;
    topicsArray = [];
    
    if(topicElements.length == 0)
    {
        output('');
        return;
    }
    
    topicElements.each(function()
    {
        topicsArray.push($(this).attr('id').split('topic_').join('').trim());
        
        topicElementCount++;
        if(topicElementCount >= topicElements.length)
        {
            output(topicsArray.join(','));
        }
    });
}
