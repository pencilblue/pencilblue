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
                required: true
            }
        }
    });
    
    $('#username').focus();
});

function login()
{
    $('#password').rules('add',
    {
        required: true
    });
    $('#login_form').attr('action', '/actions/login?admin_attempt=1');
    $('#login_form').submit();
}

function forgotPassword()
{
    $('#password').rules('remove');
    
    $('#login_form').attr('action', '/actions/forgot_password?admin=1');
    $('#login_form').submit();
}
