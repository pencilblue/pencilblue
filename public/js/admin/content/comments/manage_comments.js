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

var tableSort;

$(document).ready(function()
{
    new jNarrow('#comments_search', '.comment_row',
    {
        searchChildElement: '.comment_user',
        searchButton: '#comments_search_button',
        searchText: '<i class="fa fa-search"></i>',
        clearText: '<i class="fa fa-times"></i>',
    });

    tableSort = new TableSort(
    {
        table: '#comments_table',
        rowClass: '.comment_row',
        sortFields:
        [
            {
                header: '#comment_name_header',
                textContainer: '.comment_name'
            },
            {
                header: '#comment_content_header',
                textContainer: '.comment_content'
            },
            {
                header: '#comment_date_header',
                textContainer: '.comment_date',
                default: true
            }
        ]
    });
});

function initCommentsPagination()
{
    pagination = new Pagination('comments_pagination', '.comment_row', 30);
    $('#comments_search').keyup(pagination.initializeElements);
    $('#comments_search_button').click(pagination.initializeElements);

    tableSort.pagination = pagination;
}

function confirmDeleteComment(commentID, userName)
{
    $('#delete_name').html(userName);
    $('#delete_button').attr('onclick', 'window.location = "/actions/admin/content/comments/delete_comment/' + commentID + '"');
    $('#confirm_delete_modal').modal({backdrop: 'static', keyboard: true});
}
