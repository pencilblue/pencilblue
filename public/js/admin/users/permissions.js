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
    new jNarrow('#permissions_search', '.permission_row',
    {
        searchChildElement: '.permission_name',
        searchButton: '#permissions_search_button',
        searchText: '<i class="fa fa-search"></i>',
        clearText: '<i class="fa fa-times"></i>',
    });

    tableSort = new TableSort(
    {
        table: '#permissions_table',
        rowClass: '.permission_row',
        sortFields:
        [
            {
                header: '#permission_name_header',
                textContainer: '.permission_name'
            }
        ]
    });
});

function initPermissionsPagination()
{
    pagination = new Pagination('permissions_pagination', '.permission_row', 30);
    $('#permissions_search').keyup(pagination.initializeElements);
    $('#permissions_search_button').click(pagination.initializeElements);

    tableSort.pagination = pagination;
}
