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
    new jNarrow('#page_search', '.page_row',
    {
        searchChildElement: '.page_headline',
        searchButton: '#page_search_button',
        searchText: '<i class="fa fa-search"></i>',
        clearText: '<i class="fa fa-times"></i>',
    });

    tableSort = new TableSort(
    {
        table: '#pages_table',
        rowClass: '.page_row',
        sortFields:
        [
            {
                header: '#page_headline_header',
                textContainer: '.page_headline'
            },
            {
                header: '#page_status_header',
                textContainer: '.page_status'
            },
            {
                header: '#page_url_header',
                textContainer: '.page_url'
            },
            {
                header: '#page_author_header',
                textContainer: '.page_author'
            },
            {
                header: '#page_date_header',
                textContainer: '.page_date',
                default: true
            }
        ]
    });
});

function initPagesPagination()
{
    pagination = new Pagination('pages_pagination', '.page_row', 30);
    $('#page_search').keyup(pagination.initializeElements);
    $('#page_search_button').click(pagination.initializeElements);

    tableSort.pagination = pagination;
}

function confirmDeletePage(pageID, pageName)
{
    $('#delete_name').html(pageName);
    $('#delete_button').attr('onclick', 'window.location = "/actions/admin/content/pages/delete_page/' + pageID + '"');
    $('#confirm_delete_modal').modal({backdrop: 'static', keyboard: true});
}
