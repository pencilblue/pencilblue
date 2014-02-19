$(document).ready(function()
{    
    setupDateInputs();
});

function setupDateInputs()
{
    if(customObjectType)
    {
        for(var key in customObjectType.fields)
        {
            if(customObjectType.fields[key].field_type == 'date')
            {
                $('#' + key).datetimepicker(
                {
                    language: 'en',
                    format: 'Y-m-d H:m'
                });
            }
            else if(customObjectType.fields[key].field_type == 'child_objects')
            {
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
            }
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

function prepareNewObjectSave()
{
    if(!customObjectType)
    {
        $('#new_object_form').submit();
        return;
    }
    
    var fieldIndex = 0;
    $('.child_objects').each(function()
    {
        var key = $(this).attr('id').split('_draggable').join('');
        var activeObjects = [];
        var activeObjectsLength = $(this).find('#active_' + key + ' .child_object').length;
        var activeObjectIndex = 0;
        $(this).find('#active_' + key + ' .child_object').each(function()
        {
            activeObjects.push($(this).attr('id').split(key + '_').join(''));
            activeObjectIndex++;
            if(activeObjectIndex >= activeObjectsLength)
            {
                $('#new_object_form').append('<input type="text" name="' + key + '" value="' + activeObjects.join(',') + '" style="display: none"></input>');
                fieldIndex++;
                if(fieldIndex >= $('.child_objects').length)
                {
                    $('#new_object_form').submit();
                }
            }
        });
    });
}
