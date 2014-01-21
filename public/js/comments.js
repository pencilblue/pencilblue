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
            $('#comment_submitting_' + articleIndex).show();
            
            $.post('/api/comments/new_comment', {article: articleID, content: $('#comment_content_' + articleIndex).val()}, function(data)
            {
                var response = $.parseJSON(data);
                $('#comment_submitting_' + articleIndex).hide();
                
                if(response.code > 0)
                {
                    $('#comment_error_' + articleIndex).show();
                }
                else
                {
                    $('#comment_error_' + articleIndex).hide();
                    $('#comment_content_' + articleIndex).val('');
                    
                    var commentWell = $('#user_comment_' + articleIndex).html();
                    commentWell = commentWell.split('^content^').join(response.data.content);
                    commentWell = commentWell.split('^timestamp^').join(response.data.timestamp);
                    
                    $('#comment_container_' + articleIndex).prepend(commentWell);
                }
            });
        }
    });
}
