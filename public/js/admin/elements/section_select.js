/*
    Copyright (C) 2014  PencilBlue, LLC

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

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

function initSectionsPagination()
{
    sectionsPagination = new Pagination('sections_pagination', '#inactive_sections .section_item', 75, true);
    $('#section_search').keyup(sectionsPagination.initializeElements);
    $('#section_search_button').click(sectionsPagination.initializeElements);
}
