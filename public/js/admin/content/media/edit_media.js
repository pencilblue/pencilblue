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
            name:
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
        case 'storify':
            previewStorify(media.location);
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
