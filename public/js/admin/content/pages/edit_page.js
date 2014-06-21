/*

    Interface for editing a page

    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2014, All rights reserved

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

var autoSaveTimeout;

$(document).ready(function()
{
    $('#edit_page_form').validate(
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

    $('#publish_date').datetimepicker();

    if($('#save_draft_button').position())
    {
        resetAutoSaveTimeout();
    }
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

    if($('#url').val().toLowerCase() === $('#url').attr('data-original-url')) {
        $('#availability_button').attr('class', 'btn btn-success');
        $('#availability_button').html('<i class="fa fa-check"></i>&nbsp;' + loc.generic.AVAILABLE);
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

function getDatetimeText(date)
{
    var datetime = date.getFullYear() + '/' + getExtraZero(date.getMonth() + 1) + '/' + getExtraZero(date.getDate()) + ' ';
    datetime += getExtraZero(date.getHours()) + ':' + getExtraZero(date.getMinutes());

    return datetime;
}

function getExtraZero(dateNumber)
{
    if(dateNumber < 10)
    {
        dateNumber = '0' + dateNumber;
    }

    return dateNumber;
}

function checkForEditPageSave(draft, cb)
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

            getContentLayout(function(contentLayout)
            {
                if(!$('#page_layout').position()) {
                    $('fieldset').append('<textarea id="page_layout" name="page_layout" style="display: none">' + encodeURIComponent(contentLayout) + '</textarea>');
                }
                else {
                    $('#page_layout').val(encodeURIComponent(contentLayout));
                }

                if(!$('#draft').position()) {
                    $('fieldset').append('<input type="number" id="draft" name="draft" value="' + ((draft) ? '1' : '0') + '" style="display: none"></input>');
                }
                else {
                    $('#draft').val((draft) ? '1' : '0');
                }

                if(typeof cb === 'undefined')
                {
                    $('#edit_page_form').submit();
                }
                else
                {
                    asyncEditPageSave(cb);
                }
            });
        });
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

function asyncEditPageSave(cb)
{
    var formData = $('#edit_page_form').serialize();
    $.post('/api/admin/content/pages/save_draft' + document.URL.substr(document.URL.lastIndexOf('/')) , formData, function(data)
    {
        var result = JSON.parse(data);

        if(!result)
        {
            cb(false);
        }
        else if(result.code > 0)
        {
            cb(false);
        }
        else
        {
            $('#draft_time').show().html(getDraftTime());
            resetAutoSaveTimeout();
            cb(true);
        }
    });
}

function resetAutoSaveTimeout()
{
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout('autoSaveDraft()', 60000);
}

function getDraftTime()
{
    var date = new Date();
    var hour = date.getHours();
    if(hour < 10)
    {
        hour = '0' + hour;
    }
    var minutes = date.getMinutes();
    if(minutes < 10)
    {
        minutes = '0' + minutes;
    }

    return hour + ':' + minutes;
}

function previewPage(draft)
{
    $('#preview_button i').attr('class', 'fa fa-spinner fa-spin');

    checkForEditPageSave(draft, function(success)
    {
        $('#preview_button i').attr('class', 'fa fa-eye');
        window.open('/preview/page' + document.URL.substr(document.URL.lastIndexOf('/')));
    });
}

function autoSaveDraft()
{
    $('#preview_button i').attr('class', 'fa fa-spinner fa-spin');
    $('#save_draft_button_button i').attr('class', 'fa fa-spinner fa-spin');

    checkForEditPageSave(true, function(success)
    {
        $('#preview_button i').attr('class', 'fa fa-eye');
        $('#save_draft_button_button i').attr('class', 'fa fa-save');
    });
}
