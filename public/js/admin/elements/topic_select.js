$(document).ready(function()
{
    $('.topic').draggable({revert: 'invalid', containment: 'document', helper: 'clone', cursor: 'move'});
    $('#active_topics').droppable({accept: '.topic', drop: function(event, ui)
    {
        $('#active_topics').append(ui.draggable);
    }});
    $('#inactive_topics').droppable({accept: '.topic', drop: function(event, ui)
    {
        $('#inactive_topics').append(ui.draggable);
    }});
    
    new jNarrow('#topic_search', '#inactive_topics .topic',
    {
        searchChildElement: '.topic_name',
        searchButton: '#topic_search_button',
        searchText: '<i class="fa fa-search"></i>',
        clearText: '<i class="fa fa-times"></i>',
    });
});

function initTopicsPagination()
{
    topicsPagination = new Pagination('topics_pagination', '#inactive_topics .topic', 75, true);
    $('#topic_search').keyup(topicsPagination.initializeElements);
    $('#topic_search_button').click(topicsPagination.initializeElements);
}
