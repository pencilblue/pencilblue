/*

    Interface for managing the site's topics via drag and drop
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2013, All rights reserved

*/

var pagination;

$(document).ready(function()
{
    new jNarrow('#topic_search', '.topic',
    {
        searchChildElement: '.topic_name',
        searchButton: '#topic_search_button',
        searchText: '<i class="fa fa-search"></i>',
        clearText: '<i class="fa fa-times"></i>',
    });
});

function initTopicsPagination()
{
    pagination = new Pagination('topics_pagination', '.topic', 75);
    $('#topic_search').keyup(pagination.initializeElements);
    $('#topic_search_button').click(pagination.initializeElements);
}

function confirmDeleteTopic(topicID, topicName)
{
    $('#delete_name').html(topicName);
    $('#delete_button').attr('onclick', 'window.location = "/actions/admin/content/topics/delete_topic?id=' + topicID + '"');
    $('#confirm_delete_modal').modal({backdrop: 'static', keyboard: true});
}
