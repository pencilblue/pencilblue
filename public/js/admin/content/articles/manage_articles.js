/*

    Interface for managing articles

    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2014, All rights reserved

*/

var tableSort;

$(document).ready(function()
{
    new jNarrow('#article_search', '.article_row',
    {
        searchChildElement: '.article_headline',
        searchButton: '#article_search_button',
        searchText: '<i class="fa fa-search"></i>',
        clearText: '<i class="fa fa-times"></i>',
    });

    tableSort = new TableSort(
    {
        table: '#articles_table',
        rowClass: '.article_row',
        sortFields:
        [
            {
                header: '#article_headline_header',
                textContainer: '.article_headline'
            },
            {
                header: '#article_status_header',
                textContainer: '.article_status'
            },
            {
                header: '#article_url_header',
                textContainer: '.article_url'
            },
            {
                header: '#article_author_header',
                textContainer: '.article_author'
            },
            {
                header: '#article_date_header',
                textContainer: '.article_date',
                default: true
            }
        ]
    });
});

function initArticlesPagination()
{
    pagination = new Pagination('articles_pagination', '.article_row', 30);
    $('#article_search').keyup(pagination.initializeElements);
    $('#article_search_button').click(pagination.initializeElements);

    tableSort.pagination = pagination;
}

function confirmDeleteArticle(articleID, articleName)
{
    $('#delete_name').html(articleName);
    $('#delete_button').attr('onclick', 'window.location = "/actions/admin/content/articles/delete_article/' + articleID + '"');
    $('#confirm_delete_modal').modal({backdrop: 'static', keyboard: true});
}
