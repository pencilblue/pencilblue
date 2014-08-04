/*
    Copyright (C) 2014  PencilBlue, LLC

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
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
