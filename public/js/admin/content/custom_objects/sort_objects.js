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
    // Make the items draggable and sortable
    $('#objects_sort .panel-body').sortable({items: '.custom_object', containment: 'document', cursor: 'move'});
    $('#objects_sort .panel-body').disableSelection();
});

function prepareSortObjectsSave()
{
    var sortedObjects = [];
    var objectIndex = 0;

    $('#objects_sort .custom_object').each(function()
    {
        var objectID = $(this).attr('id').split('object_').join('');
        sortedObjects.push(objectID);

        objectIndex++;
        if(objectIndex >= $('#objects_sort .custom_object').length)
        {
            $('#sort_objects_form').append('<input type="text" name="sorted_objects" value="' + sortedObjects.join(',') + '" style="display: none"></input>');
            $('#sort_objects_form').submit();
        }
    });
}
