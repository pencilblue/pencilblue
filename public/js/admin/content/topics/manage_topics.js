$(document).ready(function()
{
    new jNarrow('#topic_search', '.topic',
    {
        searchChildElement: '.topic_name',
        searchButton: '#topic_search_button',
        searchText: '<span class="glyphicon glyphicon-search"></span>',
        clearText: '<span class="glyphicon glyphicon-remove"></span>',
    });
});

function confirmDeleteTopic(siteRoot, topicID, topicName)
{
    $('#delete_name').html(topicName);
    $('#delete_button').attr('onclick', 'window.location = "' + siteRoot + '/actions/admin/content/topics/deleteTopic?id=' + topicID + '"');
    $('#confirm_delete_modal').modal({backdrop: 'static', keyboard: true});
}
