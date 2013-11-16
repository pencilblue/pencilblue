$(document).ready(function()
{
    $('#wysiwyg').summernote(
    {
        height: 300,
        focus: true
    });
    
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
                required: true
            }
        }
    });
    
    if($('#publish_date').val().length == 0)
    {
        setPublishDateToNow();
    }
    
    $('#sections .col-md-3').draggable({revert: 'invalid', containment: 'document', helper: 'clone', cursor: 'move'});
    $('#active_sections').droppable({accept: '#sections .col-md-3', drop: function(event, ui)
    {
        $('#active_sections').append(ui.draggable);
    }});
    $('#inactive_sections').droppable({accept: '#sections .col-md-3', drop: function(event, ui)
    {
        $('#inactive_sections').append(ui.draggable);
    }});
    
    $('#url').focus();
    
    $('.topic').draggable({revert: 'invalid', containment: 'document', helper: 'clone', cursor: 'move'});
    $('#active_topics').droppable({accept: '.topic', drop: function(event, ui)
    {
        $('#active_topics').append(ui.draggable);
    }});
    $('#inactive_topics').droppable({accept: '.topic', drop: function(event, ui)
    {
        $('#inactive_topics').append(ui.draggable);
    }});
});

function setPublishDateToNow()
{
    var date = new Date();
    $('#publish_date').val(getDatetimeText(date));
}

function getDatetimeText(date)
{
    var datetime = date.getFullYear() + '-' + getExtraZero(date.getMonth() + 1) + '-' + getExtraZero(date.getDate()) + 'T';
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

function narrowTopics()
{
    var searchString = $('#topic_search').val().toLowerCase();
    if(searchString.length == 0)
    {
        $('#topic_search_icon').attr('class', 'glyphicon glyphicon-search');
    
        $('#inactive_topics .topic').each(function()
        {
            $(this).show();
        });
    }
    else
    {
        $('#topic_search_icon').attr('class', 'glyphicon glyphicon-remove');
    
        $('#inactive_topics .topic').each(function()
        {
            var topic = $(this);
            topic.find('.topic_name').each(function()
            {
                if($(this).html().toLowerCase().indexOf(searchString) > -1)
                {
                    topic.show();
                }
                else
                {
                    topic.hide();
                }
            });
        });
    }
}

function clearTopicSearch()
{
    $('#topic_search').val('');
    $('#topic_search').focus();
    narrowTopics();
}

function checkForNewArticleSave()
{
    if(!$('#article_content').position())
    {
        $('fieldset').append('<textarea id="content" name="article_content" style="display: none">' + encodeURIComponent($('#wysiwyg').code()) + '</textarea>');
    }
    else
    {
        $('#article_content').html(encodeURIComponent($('#wysiwyg').code()));
    }
    $('#new_article_form').submit();
}
