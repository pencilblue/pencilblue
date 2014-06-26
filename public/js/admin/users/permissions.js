/*

    Interface for viewing permissions

    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2013, All rights reserved

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
