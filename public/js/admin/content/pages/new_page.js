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
        id: 'publish_date',
        type: 'datetime'
    },
    {
        id: 'page_layout',
        type: 'layout'
    },
    {
        id: 'page_media',
        type: 'drag_and_drop',
        elementPrefix: 'media_',
        activeContainer: '#active_media'
    },
    {
        id: 'page_topics',
        type: 'drag_and_drop',
        elementPrefix: 'topic_',
        activeContainer: '#active_topics'
    }
];

$(document).ready(function()
{
    $('#new_page_form').validate(
    {
        rules:
        {
            url:
            {
                minlength: 2,
                required: true
            },
            template:
            {
                required: false
            }
        }
    });

    if($('#publish_date').val().length === 0)
    {
        setPublishDateToNow();
    }

    $('#publish_date').datetimepicker();

    $('#url').focus();
});

function resetURLAvailability()
{
    $('#availability_button').attr('class', 'btn btn-default');
    $('#availability_button').html(loc.generic.CHECK);
}

function validateURL()
{
    if($('#url').val().length === 0)
    {
        return;
    }

    $.getJSON('/api/url/exists_for?url=' + $('#url').val() + '&type=page', function(response)
    {
        if(response.code === 0)
        {
            if(!response.data)
            {
                $('#availability_button').attr('class', 'btn btn-success');
                $('#availability_button').html('<i class="fa fa-check"></i>&nbsp;' + loc.generic.AVAILABLE);
            }
            else
            {
                $('#availability_button').attr('class', 'btn btn-danger');
                $('#availability_button').html('<i class="fa fa-ban"></i>&nbsp;' + loc.generic.UNAVAILABLE);
            }
        }
    });
}

function setPublishDateToNow()
{
    var date = new Date();
    $('#publish_date').val(getDatetimeText(date));
}

function getDatetimeText(date) {
    return date.toLocaleString();
}

function getExtraZero(dateNumber)
{
    if(dateNumber < 10)
    {
        dateNumber = '0' + dateNumber;
    }

    return dateNumber;
}

function checkForNewPageSave(draft)
{
    // We need to remove other fieldsets so the form data isn't duplicated
    $('.modal-body fieldset').remove();

    buildTopics(function(topicsCSV)
    {
        if(!$('#page_topics').position())
        {
            $('fieldset').append('<input type="text" id="page_topics" name="page_topics" value="' + topicsCSV + '" style="display: none"></input>');
        }
        else
        {
            $('#page_topics').val(topicsCSV);
        }

        buildMedia(function(mediaCSV)
        {
            if(!$('#page_media').position())
            {
                $('fieldset').append('<input type="text" id="page_media" name="page_media" value="' + mediaCSV + '" style="display: none"></input>');
            }
            else
            {
                $('#page_media').val(mediaCSV);
            }

            var wysId = $('.wysiwyg').attr('id').substring('wysiwg_'.length + 1);
            getWYSIWYGLayout(wysId, function(layout) {
                if(!$('#page_layout').position()) {
                    $('fieldset').append('<textarea id="page_layout" name="page_layout" style="display: none">' + layout + '</textarea>');
                }
                else {
                    $('#page_layout').val(layout);
                }

                if(!$('#draft').position()) {
                    $('fieldset').append('<input type="number" id="draft" name="draft" value="' + ((draft) ? '1' : '0') + '" style="display: none"></input>');
                }
                else {
                    $('#draft').val((draft) ? '1' : '0');
                }

                var pubDateStr = $('#publish_date').val();
                var pubDateObj = new Date(pubDateStr);
                $('#publish_date').val(pubDateObj);

                $('#new_page_form').submit();
            });
        });
    });
}

function buildTopics(output)
{
    var topicElements = $('#active_topics').find('.topic');
    topicElementCount = 0;
    topicsArray = [];

    if(topicElements.length === 0)
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

function buildMedia(output)
{
    var mediaElements = $('#active_media').find('.media_item');
    mediaElementCount = 0;
    mediaArray = [];

    if(mediaElements.length === 0)
    {
        output('');
        return;
    }

    mediaElements.each(function()
    {
        mediaArray.push($(this).attr('id').split('media_').join('').trim());

        mediaElementCount++;
        if(mediaElementCount >= mediaElements.length)
        {
            output(mediaArray.join(','));
        }
    });
}
