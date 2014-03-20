/*

    Interface for managing custom object types
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2014, All rights reserved

*/

var tableSort;

$(document).ready(function()
{
    new jNarrow('#object_type_search', '.object_type_row',
    {
        searchChildElement: '.object_type_name',
        searchButton: '#object_type_search_button',
        searchText: '<i class="fa fa-search"></i>',
        clearText: '<i class="fa fa-times"></i>',
    });
    
    tableSort = new TableSort(
    {
        table: '#object_types_table',
        rowClass: '.object_type_row',
        sortFields:
        [
            {
                header: '#object_type_name_header',
                textContainer: '.object_type_name'
            },
            {
                header: '#object_type_url_header',
                textContainer: '.object_type_url'
            },
            {
                header: '#object_type_field_types_header',
                textContainer: '.object_type_field_types'
            },
            {
                header: '#object_type_date_header',
                textContainer: '.object_type_date'
            }
        ]
    });
});

function initObjectTypesPagination()
{
    pagination = new Pagination('object_types_pagination', '.object_type_row', 30);
    $('#object_type_search').keyup(pagination.initializeElements);
    $('#object_type_search_button').click(pagination.initializeElements);
    
    tableSort.pagination = pagination;
}

function confirmDeleteObjectType(objectTypeID, objectTypeName)
{
    $('#delete_name').html(objectTypeName);
    $('#delete_button').attr('onclick', 'window.location = "/actions/admin/content/custom_objects/delete_object_type?id=' + objectTypeID + '"');
    $('#confirm_delete_modal').modal({backdrop: 'static', keyboard: true});
}
