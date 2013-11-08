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
            first_name:
            {
                minlength: 2
            },
            last_name:
            {
                minlength: 2
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
        $('#password_check').attr('class', 'glyphicon glyphicon-thumbs-down');
    }
    else
    {
        $('#password_check').attr('class', 'glyphicon glyphicon-thumbs-up');
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
    
    $('#password').val(password);
    $('#confirm_password').val(password);
    checkPasswordMatch();
}
