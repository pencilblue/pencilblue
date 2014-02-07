$(document).ready(function()
{
    $('#sections_dnd .label').draggable({revert: 'invalid', containment: 'document', helper: 'clone', cursor: 'move'});
    $('#active_sections').droppable({accept: '#sections_dnd .label', drop: function(event, ui)
    {
        $('#active_sections').append(ui.draggable);
    }});
    $('#inactive_sections').droppable({accept: '#sections_dnd .label', drop: function(event, ui)
    {
        $('#inactive_sections').append(ui.draggable);
    }});
    
    new jNarrow('#section_search', '#inactive_sections .section_item',
    {
        searchChildElement: '.section_name',
        searchButton: '#section_search_button',
        searchText: '<i class="fa fa-search"></i>',
        clearText: '<i class="fa fa-times"></i>',
    });
});
