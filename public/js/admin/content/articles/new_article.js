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
        id: 'article_layout',
        type: 'layout'
    },
    {
        id: 'article_media',
        type: 'drag_and_drop',
        elementPrefix: 'media_',
        activeContainer: '#active_media'
    },
    {
        id: 'article_sections',
        type: 'drag_and_drop',
        elementPrefix: 'section_',
        activeContainer: '#active_sections'
    },
    {
        id: 'article_topics',
        type: 'drag_and_drop',
        elementPrefix: 'topic_',
        activeContainer: '#active_topics'
    }
];

$(document).ready(function()
{
    $('#new_article_form').validate(
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

    if($('#publish_date').val().length == 0)
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

    $.getJSON('/api/url/exists_for?url=' + $('#url').val() + '&type=article', function(response)
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

function checkForNewArticleSave(draft)
{
    // We need to remove other fieldsets so the form data isn't duplicated
    $('.modal-body fieldset').remove();

    buildSections(function(sectionsCSV)
    {
        if(!$('#article_sections').position())
        {
            $('fieldset').append('<input type="text" id="article_sections" name="article_sections" value="' + sectionsCSV + '" style="display: none"></input>');
        }
        else
        {
            $('#article_sections').val(sectionsCSV);
        }

        buildTopics(function(topicsCSV)
        {
            if(!$('#article_topics').position())
            {
                $('fieldset').append('<input type="text" id="article_topics" name="article_topics" value="' + topicsCSV + '" style="display: none"></input>');
            }
            else
            {
                $('#article_topics').val(topicsCSV);
            }

            buildMedia(function(mediaCSV)
            {
                if(!$('#article_media').position())
                {
                    $('fieldset').append('<input type="text" id="article_media" name="article_media" value="' + mediaCSV + '" style="display: none"></input>');
                }
                else
                {
                    $('#article_media').val(mediaCSV);
                }

                var wysId = $('.wysiwyg').attr('id').substring('wysiwg_'.length + 1);
                getWYSIWYGLayout(wysId, function(layout) {
                    if(!$('#article_layout').position()) {
                        $('fieldset').append('<textarea id="article_layout" name="article_layout" style="display: none">' + layout + '</textarea>');
                    }
                    else {
                        $('#article_layout').val(layout);
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


                    $('#new_article_form').submit();
                });
            });
        });
    });
}

function buildSections(output)
{
    var sectionElements = $('#active_sections').find('.section_item');
    sectionElementCount = 0;
    sectionsArray = [];

    if(sectionElements.length == 0)
    {
        output('');
        return;
    }

    sectionElements.each(function()
    {
        sectionsArray.push($(this).attr('id').split('section_').join('').trim());

        sectionElementCount++;
        if(sectionElementCount >= sectionElements.length)
        {
            output(sectionsArray.join(','));
        }
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

function buildMedia(output)
{
    var mediaElements = $('#active_media').find('.media_item');
    mediaElementCount = 0;
    mediaArray = [];

    if(mediaElements.length == 0)
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
