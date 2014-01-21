function confirmDeleteArticle(articleID, articleName)
{
    $('#delete_name').html(articleName);
    $('#delete_button').attr('onclick', 'window.location = "/actions/admin/content/articles/delete_article?id=' + articleID + '"');
    $('#confirm_delete_modal').modal({backdrop: 'static', keyboard: true});
}
