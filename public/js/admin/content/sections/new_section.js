/*

    Input for creating a new site section
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2013, All rights reserved

*/

$(document).ready(function()
{
    $('#new_section_form').validate(
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
    
    //animates tool tip pop-up
    $('[data-toggle="tooltip"]').tooltip(
        {
            'placement': 'bottom'
        }
    ).css(
        {
            'cursor': 'pointer'
        }
    );
});
