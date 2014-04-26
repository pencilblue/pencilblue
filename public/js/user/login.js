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

function checkForLogin(event)
{
    if(event.keyCode == 13)
    {
        login();
    }
}

function login()
{
    $('#password').rules('add',
    {
        required: true
    });
    $('#login_form').attr('action', '/actions/login');
    $('#login_form').submit();
}

function forgotPassword()
{
    $('#password').rules('remove');
    
    $('#login_form').attr('action', '/actions/forgot_password');
    $('#login_form').submit();
}
