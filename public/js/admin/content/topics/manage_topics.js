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
