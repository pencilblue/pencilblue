function narrowTopics()
{
    var searchString = $('#topic_search').val().toLowerCase();
    if(searchString.length == 0)
    {
        $('.topic').each(function()
        {
            $(this).show();
        });
    }
    else
    {
        $('#topic_search_icon').attr('class', 'glyphicon glyphicon-remove');
    
        $('.topic').each(function()
        {
            var topic = $(this);
            topic.find('.topic_name').each(function()
            {
                if($(this).html().toLowerCase().indexOf(searchString) == 0)
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
    $('#topic_search_icon').attr('class', 'glyphicon glyphicon-search');
    $('#topic_search').val('');
    $('#topic_search').focus();
    narrowTopics();
}
