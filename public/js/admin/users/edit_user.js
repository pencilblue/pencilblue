/*

    Interface for editing a user

    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2013, All rights reserved

*/

$(document).ready(function()
{
    $('#edit_user_form').validate(
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
    
    if($('#username').val().toLowerCase() === $('#username').attr('data-original-username')) {
        $('#availability_button').attr('class', 'btn btn-success');
        $('#availability_button').html('<i class="fa fa-check"></i>&nbsp;' + loc.generic.AVAILABLE);
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
