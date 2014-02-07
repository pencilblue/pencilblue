/*

    Interface for managing users
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2014, All rights reserved

*/

$(document).ready(function()
{
    new jNarrow('#user_search', '.user_row',
    {
        searchChildElement: '.user_name',
        searchButton: '#user_search_button',
        searchText: '<i class="fa fa-search"></i>',
        clearText: '<i class="fa fa-times"></i>',
    });
});
