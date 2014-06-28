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
    $('#change_password_form').validate(
    {
        rules:
        {
            current_password:
            {
                required: true
            },
            new_password:
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

function checkPasswordMatch(keepType)
{
    if(typeof keepType === 'undefined')
    {
        $('#new_password').attr('type', 'password');
    }

    if($('#new_password').val() != $('#confirm_password').val() || $('#new_password').val().length == 0)
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

    $('#new_password').attr('type', 'text');
    $('#new_password').val(password);
    $('#confirm_password').val(password);
    checkPasswordMatch(true);
}
