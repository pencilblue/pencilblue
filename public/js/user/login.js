/*
Copyright (C) 2015  PencilBlue, LLC

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
  $('#login_form').validate({
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
