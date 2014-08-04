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
            }
        }
    });

    $('#custom_fields_container').sortable({items: '.form-group', containment: 'document', cursor: 'move', axis: 'y'});
});

function resetNameAvailability()
{
    $('#name_availability_button').attr('class', 'btn btn-default');
    $('#name_availability_button').html(loc.generic.CHECK);
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
                $('#name_availability_button').html('<i class="fa fa-check"></i>&nbsp;' + loc.generic.AVAILABLE);
            }
            else
            {
                $('#name_availability_button').attr('class', 'btn btn-danger');
                $('#name_availability_button').html('<i class="fa fa-ban"></i>&nbsp;' + loc.generic.UNAVAILABLE);
            }
        }
    });
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
    var fieldOrder = [];

    if($('#custom_fields_container .form-group').length == 0)
    {
        $('#field_templates').remove();
        $('#new_object_type_form').submit();
        return;
    }

    $('#custom_fields_container .form-group').each(function()
    {
        var index = parseInt($(this).attr('id').split('custom_field_').join(''));
        var inputGroup = $(this).find('.input-group').first();
        fieldOrder.push(index);

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
                        $('#new_object_type_form').append('<input type="text" name="field_type_' + index + '" value="number" style="display: none"></input>');
                        break;
                    case loc.custom_objects.TEXT:
                    default:
                        $('#new_object_type_form').append('<input type="text" name="field_type_' + index + '" value="text" style="display: none"></input>');
                        break;
                }
            }
        }
        else if(inputGroup.attr('class').indexOf('date') > -1)
        {
            if($('#date_' + index).val().length == 0)
            {
                $('#date_' + index).remove();
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
                $('#new_object_type_form').append('<input type="text" name="field_type_' + index + '" value="' + $('#object_type_' + index).html() + '" style="display: none"></input>');
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
                $('#new_object_type_form').append('<input type="text" name="field_type_' + index + '" value="' + $('#object_type_' + index).html() + '" style="display: none"></input>');
            }
        }

        i++;
        if(i >= $('#custom_fields_container .form-group').length)
        {
            $('#new_object_type_form').append('<input type="text" name="field_order" value="' + fieldOrder.join(',') + '" style="display: none"></input>');
            $('#field_templates').remove();
            $('#new_object_type_form').submit();
        }
    });
}
