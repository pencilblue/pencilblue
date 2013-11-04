$(document).ready(function()
{
    $('#login_form').validate(
    {
        rules:
        {
            username:
            {
                minlength: 2,
                required: true
            },
            password:
            {
                required: true,
            }
        }
    });
});
