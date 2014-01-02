function refillForm(fieldValues)
{
    for(var key in fieldValues)
    {
        if($('#' + key).position())
        {
            $('#' + key).val(fieldValues[key]);
        }
    }
    
    if(fieldValues['publish_date'])
    {
        $('#publish_date').val(getDatetimeText(new Date(fieldValues['publish_date'])));
    }
    
    var formLayout = fieldValues['article_layout'] || fieldValues['page_layout'] || null;
    if(formLayout)
    {
        $('#layout_editable').html(formLayout);
        onLayoutEditableChanged();
    }
    
    var formMedia = fieldValues['article_media'] || fieldValues['page_media'] || null;
    if(formMedia)
    {
        formMedia = formMedia.split(',');
        for(var i = 0; i < formMedia.length; i++)
        {
            $('#active_media').append($('#media_' + formMedia[i]));
        }
    }
    
    var formSections = fieldValues['article_sections'] || null;
    if(formSections)
    {
        formSections = formSections.split(',');
        for(var i = 0; i < formSections.length; i++)
        {
            $('#active_sections').append($('#section_' + formSections[i]));
        }
    }
    
    var formTopics = fieldValues['article_topics'] || fieldValues['page_topics'] || null;
    if(formTopics)
    {
        formTopics = formTopics.split(',');
        for(var i = 0; i < formTopics.length; i++)
        {
            $('#active_topics').append($('#topic_' + formTopics[i]));
        }
    }
}
