/*

    Interface for managing the site's topics via drag and drop

    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2013, All rights reserved

*/

var pagination;

$(document).ready(function()
{
    new jNarrow('#name', '.topic',
    {
        searchChildElement: '.topic_name',
        searchButton: '#topic_search_button',
        searchText: '<i class="fa fa-search"></i>',
        clearText: '<i class="fa fa-times"></i>',
    });

    $('#name').keyup(checkForTopicAdd);
});

function initTopicsPagination()
{
    pagination = new Pagination('topics_pagination', '.topic', 75);
    $('#name').keyup(pagination.initializeElements);
    $('#topic_search_button').click(pagination.initializeElements);
}

function confirmDeleteTopic(topicID, topicName)
{
    $('#delete_name').html(topicName);
    $('#delete_button').attr('onclick', 'window.location = "/actions/admin/content/topics/delete_topic/' + topicID + '"');
    $('#confirm_delete_modal').modal({backdrop: 'static', keyboard: true});
}

function checkForTopicAdd(event) {
    if(event.keyCode == 13) {
        if(!$('.topic_name:visible').length) {
            $('#new_topic_form').attr('action', '/actions/admin/content/topics/new_topic?manage=1');
            $('#new_topic_form').submit();
            return;
        }

        var nameIndex = 0;
        var nameMatch = false;
        $('.topic_name:visible').each(function() {
            if($(this).html() == $('#name').val()) {
                nameMatch = true;
            }

            nameIndex++;
            if(nameIndex >= $('.topic_name:visible').length && !nameMatch) {
                $('#new_topic_form').attr('action', '/actions/admin/content/topics/new_topic?manage=1');
                $('#new_topic_form').submit();
            }
        });
    }
}
