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
