$(document).ready(function()
{
    $('#sign_up_form').validate(
    {
        rules:
        {
            email:
            {
                email: true,
                required: true
            }
        }
    });
});
