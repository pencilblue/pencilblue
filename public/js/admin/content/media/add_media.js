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

    $('.topic').draggable({revert: 'invalid', containment: 'document', helper: 'clone', cursor: 'move'});
    $('#active_topics').droppable({accept: '.topic', drop: function(event, ui)
    {
        $('#active_topics').append(ui.draggable);
    }});
    $('#inactive_topics').droppable({accept: '.topic', drop: function(event, ui)
    {
        $('#inactive_topics').append(ui.draggable);
    }});
    
    new jNarrow('#topic_search', '#inactive_topics .topic',
    {
        searchChildElement: '.topic_name',
        searchButton: '#topic_search_button',
        searchText: '<i class="fa fa-search"></i>',
        clearText: '<i class="fa fa-times"></i>',
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
    $('#save_button').removeAttr('disabled');
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
