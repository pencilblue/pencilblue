/*

    Interface for managing comments

    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2014, All rights reserved

*/

var tableSort;

$(document).ready(function()
{
    new jNarrow('#comments_search', '.comment_row',
    {
        searchChildElement: '.comment_user',
        searchButton: '#comments_search_button',
        searchText: '<i class="fa fa-search"></i>',
        clearText: '<i class="fa fa-times"></i>',
    });

    tableSort = new TableSort(
    {
        table: '#comments_table',
        rowClass: '.comment_row',
        sortFields:
        [
            {
                header: '#comment_name_header',
                textContainer: '.comment_name'
            },
            {
                header: '#comment_content_header',
                textContainer: '.comment_content'
            },
            {
                header: '#comment_date_header',
                textContainer: '.comment_date',
                default: true
            }
        ]
    });
});

function initCommentsPagination()
{
    pagination = new Pagination('comments_pagination', '.comment_row', 30);
    $('#comments_search').keyup(pagination.initializeElements);
    $('#comments_search_button').click(pagination.initializeElements);

    tableSort.pagination = pagination;
}

function confirmDeleteComment(commentID, userName)
{
    $('#delete_name').html(userName);
    $('#delete_button').attr('onclick', 'window.location = "/actions/admin/content/comments/delete_comment/' + commentID + '"');
    $('#confirm_delete_modal').modal({backdrop: 'static', keyboard: true});
}
