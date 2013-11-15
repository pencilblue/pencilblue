$(document).ready(function()
{
    $('#new_topic_form').validate(
    {
        rules:
        {
            name:
            {
                minlength: 2,
                required: true
            }
        }
    });
    
    $('#name').focus();
});
