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
    new jNarrow('#media_search', '.media_row',
    {
        searchChildElement: '.media_name',
        searchButton: '#media_search_button',
        searchText: '<i class="fa fa-search"></i>',
        clearText: '<i class="fa fa-times"></i>',
    });

    tableSort = new TableSort(
    {
        table: '#media_table',
        rowClass: '.media_row',
        sortFields:
        [
            {
                header: '#media_name_header',
                textContainer: '.media_name'
            },
            {
                header: '#media_caption_header',
                textContainer: '.media_caption'
            },
            {
                header: '#media_date_header',
                textContainer: '.media_date',
                default: true
            }
        ]
    });
});

function initMediaPagination()
{
    pagination = new Pagination('media_pagination', '.media_row', 30);
    $('#media_search').keyup(pagination.initializeElements);
    $('#media_search_button').click(pagination.initializeElements);

    tableSort.pagination = pagination;
}

function confirmDeleteMedia(mediaID, mediaName)
{
    $('#delete_name').html(mediaName);
    $('#delete_button').attr('onclick', 'window.location = "/actions/admin/content/media/delete_media/' + mediaID + '"');
    $('#confirm_delete_modal').modal({backdrop: 'static', keyboard: true});
}
