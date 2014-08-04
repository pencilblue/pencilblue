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

    if($('#url').val().toLowerCase() === $('#url').attr('data-original-url')) {
        $('#availability_button').attr('class', 'btn btn-success');
        $('#availability_button').html('<i class="fa fa-check"></i>&nbsp;' + loc.generic.AVAILABLE);
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
