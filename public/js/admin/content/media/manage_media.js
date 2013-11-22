$(document).ready(function()
{
    new jNarrow('#media_search', '.media_item',
    {
        searchChildElement: '.media_caption',
        searchButton: '#media_search_button',
        searchText: '<i class="fa fa-search"></i>',
        clearText: '<i class="fa fa-times"></i>',
    });
});

function toggleThumb(mediaItemID, thumbURL)
{
    if($('#' + mediaItemID + ' .media_item_thumb').html().length > 0)
    {
        $('#' + mediaItemID + ' .media_item_thumb').html('');
        $('#' + mediaItemID + ' .toggle_thumb_icon').attr('class', 'fa fa-eye toggle_thumb_icon');
        return;
    }
    
    $('#' + mediaItemID + ' .media_item_thumb').html('<img src="' + thumbURL + '" style="max-height: 100px; max-width: 100%"></img>');
    $('#' + mediaItemID + ' .toggle_thumb_icon').attr('class', 'fa fa-eye-slash toggle_thumb_icon');
}
