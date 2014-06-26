/*

    Interface for managing pages

    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2014, All rights reserved

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
