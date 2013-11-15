function narrowTopics()
{
    var searchString = $('#topic_search').val().toLowerCase();
    if(searchString.length == 0)
    {
        $('#topic_search_icon').attr('class', 'glyphicon glyphicon-search');
    
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

function confirmDeleteTopic(siteRoot, topicID, topicName)
{
    $('#delete_name').html(topicName);
    $('#delete_button').attr('onclick', 'window.location = "' + siteRoot + '/actions/admin/content/topics/deleteTopic?id=' + topicID + '"');
    $('#confirm_delete_modal').modal({backdrop: 'static', keyboard: true});
}
