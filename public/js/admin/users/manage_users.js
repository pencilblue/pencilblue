/*
    Copyright (C) 2014  PencilBlue, LLC

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
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
