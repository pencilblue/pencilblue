/*

    Interface for managing media
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2013, All rights reserved

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
