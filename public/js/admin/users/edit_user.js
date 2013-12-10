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
