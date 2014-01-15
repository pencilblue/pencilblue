var formRefillOptions =
[
    {
        id: 'carousel',
        type: 'drag_and_drop',
        elementPrefix: 'media_',
        activeContainer: '#active_media'
    }
];

$(document).ready(function()
{
    makeMediaDraggable();
});

// Because this content is loaded by ng-include, we have to make the drag and drop and narrow setups async
function makeMediaDraggable()
{
    if($('.media_item').length == 0)
    {
        setTimeout('makeMediaDraggable()', 1000);
        return;
    }
    
    $('.media_item').draggable({revert: 'invalid', containment: 'document', helper: 'clone', cursor: 'move'});
    $('#active_media').droppable({accept: '.media_item', drop: function(event, ui)
    {
        $('#active_media').append(ui.draggable);
    }});
    $('#inactive_media').droppable({accept: '.media_item', drop: function(event, ui)
    {
        $('#inactive_media').append(ui.draggable);
    }});
    
    new jNarrow('#media_search', '#inactive_media .media_item',
    {
        searchChildElement: '.media_name',
        searchButton: '#media_search_button',
        searchText: '<i class="fa fa-search"></i>',
        clearText: '<i class="fa fa-times"></i>',
    });
}
