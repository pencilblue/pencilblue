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

function resetURLAvailability()
{
    $('#availability_button').attr('class', 'btn btn-default');
    $('#availability_button').html(loc.generic.CHECK);
}

function validateURL()
{
    if($('#url').val().length === 0)
    {
        return;
    }

    $.getJSON('/api/url/exists_for?url=' + $('#url').val() + '&type=section', function(response)
    {
        if(response.code === 0)
        {
            if(!response.data)
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
