$(document).ready(function()
{
    $('#wysiwyg').summernote(
    {
        height: 300,
        focus: true
    });
    
    $('#new_article_form').validate(
    {
        rules:
        {
            url:
            {
                minlength: 2,
                required: true
            },
            template:
            {
                required: true,
            }
        }
    });
});

function checkForNewArticleSave()
{
    if($('#url').val().length > 1)
    {
        if(!$('#content').position())
        {
            $('#new_article_form').append('<textarea id="content" name="content" style="display: none">' + $('#wysiwyg').code() + '</textarea>';
        }
        else
        {
            $('#content').html($('#wysiwyg').code());
        }
        $('#new_article_form').submit();
    }
}
