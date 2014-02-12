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

function initUsersPagination()
{
    pagination = new Pagination('users_pagination', '.user_row', 30);
    $('#user_search').keyup(pagination.initializeElements);
    $('#user_search_button').click(pagination.initializeElements);
}

function confirmDeleteUser(userID, userName)
{
    $('#delete_name').html(userName);
    $('#delete_button').attr('onclick', 'window.location = "/actions/admin/content/users/delete_user?id=' + userID + '"');
    $('#confirm_delete_modal').modal({backdrop: 'static', keyboard: true});
}
