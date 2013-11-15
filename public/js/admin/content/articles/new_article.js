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
