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
    else if(mediaURL.indexOf('instagram.com') != -1)
    {
        if(mediaURL.substr(mediaURL.length - 1) == '/')
        {
            mediaURL = mediaURL.substr(0, mediaURL.length - 1);
        }
        var videoID = mediaURL.substr(mediaURL.lastIndexOf('/') + 1);
        if(videoID.indexOf('&') != -1)
        {
            videoID = videoID.substr(0, videoID.indexOf('&'));
        }
        setMediaValues(isFile, 'instagram', videoID);
        previewInstagram(videoID);
    }
    else if(mediaURL.indexOf('slideshare.net') != -1)
    {
        if(mediaURL.substr(mediaURL.length - 1) == '/')
        {
            mediaURL = mediaURL.substr(0, mediaURL.length - 1);
        }
        $.getJSON('http://www.slideshare.net/api/oembed/2?url=' + mediaURL + '&format=jsonp&callback=?', function(data)
        {
            var slideshowID = data.slideshow_id;
            if(!slideshowID)
            {
                $('#media_modal').modal('hide');
                return;
            }
            setMediaValues(isFile, 'slideshare', slideshowID);
            previewSlideshare(slideshowID);
        });
    }
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
        case 'instagram':
            output('');
            break;
        case 'slideshare':
            output(location);
            break;
        default:
            return '';
            break;
    }
}

function previewImage(mediaURL)
{
    $('#media_display').html('<img src="' + mediaURL + '" style="max-height: 200px;"/>');
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

function previewInstagram(videoID)
{
    $('#media_display').html('<iframe src="//instagram.com/p/' + videoID + '/embed/" width="300" height="350" frameborder="0" scrolling="no" allowtransparency="true"></iframe>');
}

function previewSlideshare(slideshowID)
{
    $('#media_display').html('<iframe src="http://www.slideshare.net/slideshow/embed_code/' + slideshowID + '" width="427" height="356" frameborder="0" marginwidth="0" marginheight="0" scrolling="no" allowfullscreen></iframe>');
}
