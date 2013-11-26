$(document).ready(function()
{
    new jNarrow('#media_search', '.media_item',
    {
        searchChildElement: '.media_name',
        searchButton: '#media_search_button',
        searchText: '<i class="fa fa-search"></i>',
        clearText: '<i class="fa fa-times"></i>',
    });
});

function confirmDeleteMedia(siteRoot, mediaID, mediaName)
{
    $('#delete_name').html(mediaName);
    $('#delete_button').attr('onclick', 'window.location = "' + siteRoot + '/actions/admin/content/media/delete_media?id=' + mediaID + '"');
    $('#confirm_delete_modal').modal({backdrop: 'static', keyboard: true});
}
