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
    $('#type').val(type);
    $('#location').val(location);
}

function previewImage(mediaURL)
{
    $('#media_display').html('<img src="' + mediaURL + '" style="max-height: 200px;"></img>');
    $('#link_to_media_modal').modal('hide');
}

function previewHTML5Video(mediaURL, codec)
{
    $('#media_display').html('<video style="max-height: 300px;" controls><source src="' + mediaURL + '" type="' + codec + '"></video>');
    $('#link_to_media_modal').modal('hide');
}

function previewYouTube(videoID)
{
    $('#media_display').html('<iframe width="420" height="315" src="//www.youtube.com/embed/' + videoID + '" frameborder="0" allowfullscreen></iframe>');
    $('#link_to_media_modal').modal('hide');
}

function previewVimeo(videoID)
{
    $('#media_display').html('<iframe src="//player.vimeo.com/video/' + videoID + '" width="500" height="281" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>');
    $('#link_to_media_modal').modal('hide');
}

function previewDailyMotion(videoID)
{
    $('#media_display').html('<iframe frameborder="0" width="480" height="270" src="http://www.dailymotion.com/embed/video/' + videoID + '"></iframe>');
    $('#link_to_media_modal').modal('hide');
}
