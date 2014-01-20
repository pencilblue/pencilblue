function submitComment(button)
{
    if(!button)
    {
        return;
    }
    
    var buttonID = button.attr('id');
    var articleIndex = buttonID.split('comment_submit_button_').join('');
    
    if($('#comment_content_' + articleIndex).val().length == 0)
    {
        return;
    }
    
    $('.article').each(function()
    {
        if($(this).attr('article-index') == articleIndex)
        {
            var articleID = $(this).attr('id').split('article_').join('');
            
            $.post('/api/comments/new_comment', {article: articleID, content: $('#comment_content_' + articleIndex).val()}, function(data)
            {
                alert(data);
            });
        }
    });
}
