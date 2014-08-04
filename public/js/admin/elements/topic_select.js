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
