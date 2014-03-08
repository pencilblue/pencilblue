$(document).ready(function()
{
    $('#sign_up_form').validate(
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

function resetUsernameAvailability()
{
    $('#availability_button').attr('class', 'btn btn-default');
    $('#availability_button').html(loc.users.CHECK);
}

function validateUsername()
{
    if($('#username').val().length == 0)
    {
        return;
    }
    
    $.getJSON('/api/user/get_username_available?username=' + $('#username').val(), function(response)
    {
        if(response.code == 0)
        {
            if(response.data)
            {
                $('#availability_button').attr('class', 'btn btn-success');
                $('#availability_button').html('<i class="fa fa-check"></i>&nbsp;' + loc.generic.AVAILABLE);
            }
            else
            {
                $('#availability_button').attr('class', 'btn btn-danger');
                $('#availability_button').html('<i class="fa fa-ban"></i>&nbsp;' + loc.generic.UNAVAILABLE);
            }
        }
    });
}

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
