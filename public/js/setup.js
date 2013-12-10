$(document).ready(function()
{
    $('#setup_form').validate(
    {
        rules:
        {
            username:
            {
                minlength: 2,
                required: true
            },
            email:
            {
                email: true,
                required: true
            },
            password:
            {
                required: true
            },
            confirm_password:
            {
                required: true
            }
        }
    });
});

function checkPasswordMatch()
{
    if($('#password').val() != $('#confirm_password').val() || $('#password').val().length == 0)
    {
        $('#password_check').attr('class', 'fa fa-thumbs-down');
        $('#password_check').attr('style', 'color: #AA0000');
    }
    else
    {
        $('#password_check').attr('class', 'fa fa-thumbs-up');
        $('#password_check').attr('style', 'color: #00AA00');
    }
}
