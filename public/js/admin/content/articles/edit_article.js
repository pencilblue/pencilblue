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

var autoSaveTimeout;

$(document).ready(function()
{
    $('#edit_article_form').validate(
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

function checkForEditArticleSave(draft, cb)
{
    // We need to remove other fieldsets so the form data isn't duplicated
    $('.modal-body fieldset').remove();
    $('fieldset .additions').html('');

    buildSections(function(sectionsCSV)
    {
        if(!$('#article_sections').position())
        {
            $('fieldset .additions').append('<input type="text" id="article_sections" name="article_sections" value="' + sectionsCSV + '"></input>');
        }
        else
        {
            $('#article_sections').val(sectionsCSV);
        }

        buildTopics(function(topicsCSV)
        {
            if(!$('#article_topics').position())
            {
                $('fieldset .additions').append('<input type="text" id="article_topics" name="article_topics" value="' + topicsCSV + '"></input>');
            }
            else
            {
                $('#article_topics').val(topicsCSV);
            }

            buildMedia(function(mediaCSV)
            {
                if(!$('#article_media').position())
                {
                    $('fieldset .additions').append('<input type="text" id="article_media" name="article_media" value="' + mediaCSV + '"></input>');
                }
                else
                {
                    $('#article_media').val(mediaCSV);
                }

                getContentLayout(function(contentLayout)
                {
                    if(!$('#article_layout .additions').position()) {
                        $('fieldset').append('<textarea id="article_layout" name="article_layout" style="display: none">' + encodeURIComponent(contentLayout) + '</textarea>');
                    }
                    else {
                        $('#article_layout').val(encodeURIComponent(contentLayout));
                    }

                    if(!$('#draft').position()) {
                        $('fieldset .additions').append('<input type="number" id="draft" name="draft" value="' + ((draft) ? '1' : '0') + '" style="display: none"></input>');
                    }
                    else {
                        $('#draft').val((draft) ? '1' : '0');
                    }

                    if(typeof cb === 'undefined')
                    {
                        $('#edit_article_form').submit();
                    }
                    else
                    {
                        asyncEditArticleSave(cb);
                    }
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

function asyncEditArticleSave(cb)
{
    var formData = $('#edit_article_form').serialize();
    $.post('/api/admin/content/articles/save_draft' + document.URL.substr(document.URL.lastIndexOf('/')) , formData, function(data)
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

function previewArticle(draft)
{
    $('#preview_button i').attr('class', 'fa fa-spinner fa-spin');

    checkForEditArticleSave(draft, function(success)
    {
        $('#preview_button i').attr('class', 'fa fa-eye');
        window.open('/preview/article' + document.URL.substr(document.URL.lastIndexOf('/')));
    });
}

function autoSaveDraft()
{
    $('#preview_button i').attr('class', 'fa fa-spinner fa-spin');
    $('#save_draft_button_button i').attr('class', 'fa fa-spinner fa-spin');

    checkForEditArticleSave(true, function(success)
    {
        $('#preview_button i').attr('class', 'fa fa-eye');
        $('#save_draft_button_button i').attr('class', 'fa fa-save');
    });
}
