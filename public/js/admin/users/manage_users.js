/*

    Interface for managing users

    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2014, All rights reserved

*/

var tableSort;

$(document).ready(function()
{
    new jNarrow('#user_search', '.user_row',
    {
        searchChildElement: '.user_name',
        searchButton: '#user_search_button',
        searchText: '<i class="fa fa-search"></i>',
        clearText: '<i class="fa fa-times"></i>',
    });

    tableSort = new TableSort(
    {
        table: '#users_table',
        rowClass: '.user_row',
        sortFields:
        [
            {
                header: '#user_username_header',
                textContainer: '.user_username'
            },
            {
                header: '#user_name_header',
                textContainer: '.user_name'
            },
            {
                header: '#user_email_header',
                textContainer: '.user_email'
            },
            {
                header: '#user_date_header',
                textContainer: '.user_date',
                default: true
            }
        ]
    });
});

function initUsersPagination()
{
    pagination = new Pagination('users_pagination', '.user_row', 30);
    $('#user_search').keyup(pagination.initializeElements);
    $('#user_search_button').click(pagination.initializeElements);

    tableSort.pagination = pagination;
}

function confirmDeleteUser(userID, userName)
{
    $('#delete_name').html(userName);
    $('#delete_button').attr('onclick', 'window.location = "/actions/admin/users/delete_user/' + userID + '"');
    $('#confirm_delete_modal').modal({backdrop: 'static', keyboard: true});
}
