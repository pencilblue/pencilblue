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

function validateMediaURL()
{
    var mediaURL = $('#media_url').val();
    if(mediaURL.length == 0)
    {
        $('#link_to_media_modal').modal('hide');
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
            setMediaValues(false, 'image', mediaURL);
            previewImage(mediaURL);
            return;
        case 'mp4':
            setMediaValues(false, 'video/mp4', mediaURL);
            previewHTML5Video(mediaURL, 'video/mp4');
            return;
        case 'webm':
            setMediaValues(false, 'video/webm', mediaURL);
            previewHTML5Video(mediaURL, 'video/webm');
            return;
        case 'ogv':
            setMediaValues(false, 'video/ogg', mediaURL);
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
            setMediaValues(false, 'youtube', videoID);
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
            setMediaValues(false, 'youtube', videoID);
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
            setMediaValues(false, 'vimeo', videoID);
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
        setMediaValues(false, 'daily_motion', videoID);
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
            setMediaValues(false, 'daily_motion', videoID);
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
        $('#link_to_media_modal').modal('hide');
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
