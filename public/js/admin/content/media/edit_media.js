var formRefillOptions =
[
    {
        id: 'media_topics',
        type: 'drag_and_drop',
        elementPrefix: 'topic_',
        activeContainer: '#active_topics'
    }
];

$(document).ready(function()
{
    $('#edit_media_form').validate(
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

function getMediaEmbed(media)
{
    switch(media.media_type)
    {
        case 'image':
            previewImage(media.location);
            break;
        case 'video/mp4':
        case 'video/webm':
        case 'video/ogg':
            previewHTML5Video(media.location, media.media_type);
            break;
        case 'youtube':
            previewYouTube(media.location);
            break;
        case 'vimeo':
            previewVimeo(media.location);
            break;
        case 'daily_motion':
            previewDailyMotion(media.location);
            break;
        case 'vine':
            previewVine(media.location);
            break;
        case 'instagram':
            previewInstagram(media.location);
            break;
        case 'slideshare':
            previewSlideshare(media.location);
            break;
        case 'trinket':
            previewTrinket(media.location);
            break;
        default:
            break;
    }
}

function checkForEditMediaSave()
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

        $('#edit_media_form').submit();
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
