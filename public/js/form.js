function refillForm(fieldValues)
{
    for(var key in fieldValues)
    {
        if($('#' + key).position())
        {
            $('#' + key).val(fieldValues[key]);
        }
    }
    
    if(typeof formRefillOptions !== 'undefined')
    {
        for(var i = 0; i < formRefillOptions.length; i++)
        {
            var option = formRefillOptions[i];
            if(!fieldValues[option.id])
            {
                continue;
            }
            
            switch(option.type)
            {
                case 'datetime':
                    $('#' + option.id).val(getDatetimeText(new Date(fieldValues[option.id])));
                    break;
                case 'layout':
                    $('#layout_editable').html(fieldValues[option.id]);
                    $('#layout_editable').focus();
                    onLayoutEditableChanged();
                    break;
                case 'drag_and_drop':
                    refillDragAndDrop(option, fieldValues);
                    break;
                default:
                    break;
            }
        }
    }
}

function refillDragAndDrop(option, fieldValues)
{
    var uids = fieldValues[option.id].split(',');
    for(var i = 0; i < uids.length; i++)
    {
        $(option.activeContainer).append($('#' + option.elementPrefix + uids[i]));
    }
}
