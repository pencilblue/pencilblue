/*

    Interface for managing custom object types
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2014, All rights reserved

*/

$(document).ready(function()
{
    new jNarrow('#object_type_search', '.object_type_row',
    {
        searchChildElement: '.object_type_name',
        searchButton: '#object_type_search_button',
        searchText: '<i class="fa fa-search"></i>',
        clearText: '<i class="fa fa-times"></i>',
    });
});

function initObjectTypesPagination()
{
    pagination = new Pagination('object_types_pagination', '.object_type_row', 30);
    $('#object_type_search').keyup(pagination.initializeElements);
    $('#object_type_search_button').click(pagination.initializeElements);
}

function confirmDeleteObjectType(objectTypeID, objectTypeName)
{
    $('#delete_name').html(objectTypeName);
    $('#delete_button').attr('onclick', 'window.location = "/actions/admin/content/custom_objects/delete_object_type?id=' + objectTypeID + '"');
    $('#confirm_delete_modal').modal({backdrop: 'static', keyboard: true});
}
