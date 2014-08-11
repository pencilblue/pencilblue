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
    setupInputs();
});

function setupInputs()
{
    if(customObjectType)
    {
        for(var key in customObjectType.fields)
        {
            if(customObjectType.fields[key].field_type == 'date')
            {
                $('#' + key).datetimepicker();
            }
            else if(customObjectType.fields[key].field_type == 'child_objects')
            {
                setupChildObjectInput(key);
            }
        }
    }
}

function setupChildObjectInput(key) {
    $('#' + key + '_draggable .child_object').draggable({revert: 'invalid', containment: 'document', helper: 'clone', cursor: 'move'});
    $('#active_' + key).droppable({accept: '#' + key + '_draggable .child_object', drop: function(event, ui)
    {
        $('#active_' + key).append(ui.draggable);
    }});
    $('#inactive_' + key).droppable({accept: '#' + key + '_draggable .child_object', drop: function(event, ui)
    {
        $('#inactive_' + key).append(ui.draggable);
    }});

    new jNarrow('#' + key + '_search', '#inactive_' + key + ' .child_object',
    {
        searchChildElement: '.' + key + '_name',
        searchButton: '#' + key + '_search_button',
        searchText: '<i class="fa fa-search"></i>',
        clearText: '<i class="fa fa-times"></i>',
    });

    var val = customObject[key];
    if (val && val.length) {
        for (var i = 0; i < val.length; i++) {
            $('#active_' + key).append($('#' + key + '_' + val[i]));
        }
    }
}

function initCustomObjectsPagination()
{
    if(customObjectType)
    {
        for(var key in customObjectType.fields)
        {
            if(customObjectType.fields[key].field_type == 'child_objects')
            {
                var pagination = new Pagination(key + '_pagination', '.child_object', 50);
                $('#' + key + '_search').keyup(pagination.initializeElements);
                $('#' + key + '_search_button').click(pagination.initializeElements);
            }
        }
    }
}

function prepareEditObjectSave()
{
    if(!customObjectType || $('.child_objects').length == 0)
    {
        $('#edit_object_form').submit();
        return;
    }

    var fieldIndex = 0;
    $('.child_objects').each(function()
    {
        var key = $(this).attr('id').split('_draggable').join('');
        var activeObjects = [];
        var activeObjectsLength = $(this).find('#active_' + key + ' .child_object').length;
        var activeObjectIndex = 0;

        if(activeObjectsLength == 0)
        {
            $('#' + key + '_search').remove();
            $('#edit_object_form').append('<input type="text" name="' + key + '" value="" style="display: none"></input>');
            fieldIndex++;
            if(fieldIndex >= $('.child_objects').length)
            {
                $('#edit_object_form').submit();
            }
            return;
        }

        $(this).find('#active_' + key + ' .child_object').each(function()
        {
            activeObjects.push($(this).attr('id').split(key + '_').join(''));
            activeObjectIndex++;
            if(activeObjectIndex >= activeObjectsLength)
            {
                $('#' + key + '_search').remove();
                $('#edit_object_form').append('<input type="text" name="' + key + '" value="' + activeObjects.join(',') + '" style="display: none"></input>');
                fieldIndex++;
                if(fieldIndex >= $('.child_objects').length)
                {
                    $('#edit_object_form').submit();
                }
            }
        });
    });
}
