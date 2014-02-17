var customFieldIndex = 0;

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
    var field = $(templateDiv).html().split('^index^').join(customFieldIndex);
    $('#custom_fields_container').append(field);
    customFieldIndex++;
}

function removeCustomField(index)
{
    $('#custom_field_' + index).remove();
}

function selectObjectType(type, index)
{
    $('#object_type_' + index).html(type);
}

function prepareNewObjectTypeSave()
{
    var i = 0;

    $('#custom_fields_container .form-group').each(function()
    {
        var index = parseInt($(this).attr('id').split('custom_field_').join(''));
        var inputGroup = $(this).find('.input-group').first();
        
        if(inputGroup.attr('class').indexOf('value') > -1)
        {
            if($('#value_' + index).val().length == 0)
            {
                $('#value_' + index).remove();
            }
            else
            {
                switch($('#object_type_' + index).html())
                {
                    case loc.custom_objects.NUMBER:
                        $('#new_object_type_form').append('<input type="text" name="field_type_' + index + '" value="number"></input>');
                        break;
                    case loc.custom_objects.TEXT:
                    default:
                        $('#new_object_type_form').append('<input type="text" name="field_type_' + index + '" value="text"></input>');
                        break;
                }
            }
        }
        else if(inputGroup.attr('class').indexOf('peer_object') > -1)
        {
            if($('#peer_object_' + index).val().length == 0 || $('#object_type_' + index).html() == loc.custom_objects.OBJECT_TYPE)
            {
                $('#peer_object_' + index).remove();
            }        
            else
            {
                $('#new_object_type_form').append('<input type="text" name="field_type_' + index + '" value="' + $('#object_type_' + index).html() + '"></input>');
            }
        }
        else if(inputGroup.attr('class').indexOf('child_objects') > -1 || $('#object_type_' + index).html() == loc.custom_objects.OBJECT_TYPE)
        {
            if($('#child_objects_' + index).val().length == 0)
            {
                $('#child_objects_' + index).remove();
            }
            else
            {
                $('#new_object_type_form').append('<input type="text" name="field_type_' + index + '" value="' + $('#object_type_' + index).html() + '"></input>');
            }
        }
        
        i++;
        if(i >= $('#custom_fields_container .form-group').length)
        {
            $('#new_object_type_form').submit();
        }
    });
}
