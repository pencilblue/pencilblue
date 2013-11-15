$(document).ready(function()
{
    $('#new_section_form').validate(
    {
        rules:
        {
            name:
            {
                minlength: 2,
                required: true
            },
            editor:
            {
                required: true,
            }
        }
    });
    
    $('#name').focus();
});
