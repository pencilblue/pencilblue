/*

    Organizes the custom objects via drag and drop
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2014, All rights reserved

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
