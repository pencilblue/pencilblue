/*

    Interface for managing articles
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2014, All rights reserved

*/

$(document).ready(function()
{
    new jNarrow('#article_search', '.article_row',
    {
        searchChildElement: '.article_headline',
        searchButton: '#article_search_button',
        searchText: '<i class="fa fa-search"></i>',
        clearText: '<i class="fa fa-times"></i>',
    });
});

function initArticlesPagination()
{
    pagination = new Pagination(".article_row", 30);
    $('#article_search').keyup(pagination.initializeElements);
    $('#article_search_button').click(pagination.initializeElements);
}

function confirmDeleteArticle(articleID, articleName)
{
    $('#delete_name').html(articleName);
    $('#delete_button').attr('onclick', 'window.location = "/actions/admin/content/articles/delete_article?id=' + articleID + '"');
    $('#confirm_delete_modal').modal({backdrop: 'static', keyboard: true});
}
