/*

    Interface for adding a new page
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2013, All rights reserved

*/

$(document).ready(function()
{
    $('#wysiwyg').summernote(
    {
        height: 300,
        focus: true
    });
    
    $('#url').focus();
});
