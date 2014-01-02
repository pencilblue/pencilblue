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
                required: true
            }
        }
    });
    
    if($('#publish_date').val().length == 0)
    {
        setPublishDateToNow();
    }
    
    $('#publish_date').datetimepicker(
    {
        language: 'en',
        format: 'Y-m-d H:m'
    });
    
    $('#url').focus();
});

function setPublishDateToNow()
{
    var date = new Date();
    $('#publish_date').val(getDatetimeText(date));
}

function getDatetimeText(date)
{
    var datetime = date.getFullYear() + '-' + getExtraZero(date.getMonth() + 1) + '-' + getExtraZero(date.getDate()) + ' ';
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
            
                $('fieldset').append('<textarea id="article_layout" name="article_layout" style="display: none">' + $('#layout_editable').html() + '</textarea>');
                
                $('#new_article_form').submit();
            });
        });
    });
}

function buildSections(output)
{
    var sectionElements = $('#active_sections').find('.section');
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
    var mediaElements = $('#active_media').find('.col-md-3');
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
