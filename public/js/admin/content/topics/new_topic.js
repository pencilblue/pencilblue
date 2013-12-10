/*

    Interface for adding a new topic
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2013, All rights reserved

*/

$(document).ready(function()
{
    $('#new_topic_form').validate(
    {
        rules:
        {
            name:
            {
                minlength: 2,
                required: true
            }
        }
    });
    
    $('#name').focus();
});
