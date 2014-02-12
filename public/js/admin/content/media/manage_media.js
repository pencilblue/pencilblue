/*

    Interface for managing media
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2013, All rights reserved

*/

$(document).ready(function()
{
    new jNarrow('#media_search', '.media_row',
    {
        searchChildElement: '.media_name',
        searchButton: '#media_search_button',
        searchText: '<i class="fa fa-search"></i>',
        clearText: '<i class="fa fa-times"></i>',
    });
});

function initMediaPagination()
{
    pagination = new Pagination('media_pagination', '.media_row', 30);
    $('#media_search').keyup(pagination.initializeElements);
    $('#media_search_button').click(pagination.initializeElements);
}

function confirmDeleteMedia(siteRoot, mediaID, mediaName)
{
    $('#delete_name').html(mediaName);
    $('#delete_button').attr('onclick', 'window.location = "' + siteRoot + '/actions/admin/content/media/delete_media?id=' + mediaID + '"');
    $('#confirm_delete_modal').modal({backdrop: 'static', keyboard: true});
}
