$(document).ready(function()
{
    $('#new_object_type_form').validate(
    {
        rules:
        {
            name:
            {
                minlength: 2,
                required: true
            },
            url:
            {
                minlength: 2,
                required: true
            }
        }
    });
    
    $('#custom_fields_container').sortable({items: '.form-group', containment: 'document', cursor: 'move', axis: 'y'});
    $('#custom_fields_container').disableSelection();
});

function resetNameAvailability()
{
    $('#name_availability_button').attr('class', 'btn btn-default');
    $('#name_availability_button').html(loc.users.CHECK);
}

function resetURLAvailability()
{
    $('#url_availability_button').attr('class', 'btn btn-default');
    $('#url_availability_button').html(loc.users.CHECK);
}

function validateName()
{
    if($('#name').val().length == 0)
    {
        return;
    }
    
    $.getJSON('/api/custom_objects/get_object_type_name_available?name=' + $('#name').val(), function(response)
    {
        if(response.code == 0)
        {
            if(response.data)
            {
                $('#name_availability_button').attr('class', 'btn btn-success');
                $('#name_availability_button').html('<i class="fa fa-check"></i>&nbsp;' + loc.users.AVAILABLE);
                
                setURLFromName();
            }
            else
            {
                $('#name_availability_button').attr('class', 'btn btn-danger');
                $('#name_availability_button').html('<i class="fa fa-ban"></i>&nbsp;' + loc.users.UNAVAILABLE);
            }
        }
    });
}

function validateURL()
{
    if($('#url').val().length == 0)
    {
        return;
    }
    
    $.getJSON('/api/custom_objects/get_object_type_url_available?url=' + $('#url').val(), function(response)
    {
        if(response.code == 0)
        {
            if(response.data)
            {
                $('#url_availability_button').attr('class', 'btn btn-success');
                $('#url_availability_button').html('<i class="fa fa-check"></i>&nbsp;' + loc.users.AVAILABLE);
            }
            else
            {
                $('#url_availability_button').attr('class', 'btn btn-danger');
                $('#url_availability_button').html('<i class="fa fa-ban"></i>&nbsp;' + loc.users.UNAVAILABLE);
            }
        }
    });
}

function setURLFromName()
{
    var url = $('#name').val().toLowerCase().split(' ').join('_');
    $('#url').val(url);
    validateURL();
}

function addCustomField(templateDiv)
{
    $('#custom_fields_container').append($(templateDiv).html());
}
