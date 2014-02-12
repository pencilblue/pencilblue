/*

    Interface for managing pages
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2014, All rights reserved

*/

$(document).ready(function()
{
    new jNarrow('#page_search', '.page_row',
    {
        searchChildElement: '.page_headline',
        searchButton: '#page_search_button',
        searchText: '<i class="fa fa-search"></i>',
        clearText: '<i class="fa fa-times"></i>',
    });
});

function initPagesPagination()
{
    pagination = new Pagination('pages_pagination', '.page_row', 30);
    $('#page_search').keyup(pagination.initializeElements);
    $('#page_search_button').click(pagination.initializeElements);
}

function confirmDeletePage(siteRoot, pageID, pageName)
{
    $('#delete_name').html(pageName);
    $('#delete_button').attr('onclick', 'window.location = "' + siteRoot + '/actions/admin/content/pages/delete_page?id=' + pageID + '"');
    $('#confirm_delete_modal').modal({backdrop: 'static', keyboard: true});
}
