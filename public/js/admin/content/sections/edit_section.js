/*

    Input for editing a site section
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2013, All rights reserved

*/

$(document).ready(function()
{
    $('#edit_section_form').validate(
    {
        rules:
        {
            name:
            {
                minlength: 2,
                required: true
            },
            editor:
            {
                required: true,
            }
        }
    });
    
    $('#name').focus();
});
