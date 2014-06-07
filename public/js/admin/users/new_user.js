/*

    Interface for adding a new user

    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2013, All rights reserved

*/

$(document).ready(function()
{
    $('#new_user_form').validate(
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
    $('#availability_button').html(loc.generic.CHECK);
}

function validateUsername()
{
    if($('#username').val().length === 0)
    {
        return;
    }

    $.getJSON('/api/user/get_username_available?username=' + $('#username').val(), function(response)
    {
        if(response.code === 0)
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

function checkPasswordMatch(keepType)
{
    if(typeof keepType === 'undefined')
    {
        $('#password').attr('type', 'password');
    }

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

function generatePassword()
{
    var characters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '!', '@', '#', '$', '%', '^', '&', '*', '?'];

    var password = '';
    while(password.length < 8)
    {
        password = password.concat(characters[parseInt(Math.random() * characters.length)]);
    }

    $('#password').attr('type', 'text');
    $('#password').val(password);
    $('#confirm_password').val(password);
    checkPasswordMatch(true);
}
