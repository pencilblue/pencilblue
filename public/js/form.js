/*
    Copyright (C) 2015  PencilBlue, LLC

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
            if(typeof fieldValues[option.id] === 'undefined')
            {
                continue;
            }

            switch(option.type)
            {
                case 'datetime':
                    $('#' + option.id).val(getDatetimeText(new Date(fieldValues[option.id])));
                    break;
                case 'layout':
                    $('.layout_editable').html(fieldValues[option.id]);
                    $('.layout_editable').focus();
                    initWYSIWYG();
                    break;
                case 'drag_and_drop':
                    refillDragAndDrop(option, fieldValues);
                    break;
                case 'button_group':
                    $('#' + option.elementPrefix + fieldValues[option.id]).click();
                    break;
                default:
                    break;
            }

            if(typeof option.onComplete !== 'undefined')
            {
                option.onComplete();
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
