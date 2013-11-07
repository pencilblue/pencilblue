$(document).ready(function()
{
    $('#wysiwyg').summernote(
    {
        height: 300,
        focus: true
    });
});

$('#content_tab a').click(function(e)
{
    e.preventDefault();
    $(this).tab('show');
});

$('#meta_data_tab a').click(function(e)
{
    e.preventDefault();
    $(this).tab('show');
});
