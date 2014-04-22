/*

    Organizes the site's sections via drag and drop
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2013, All rights reserved

*/

$(document).ready(function()
{
    // Make the items draggable and sortable
    $('#section_map').sortable({items: '.section', containment: 'document', cursor: 'move', axis: 'y'});
    $('#section_map').disableSelection();

    $('#section_map .panel-body').sortable({items: '.subsection', containment: 'document', cursor: 'move'});
    $('#section_map .panel-body').disableSelection();
});

// Prepares the map data for saving
function buildSectionMap()
{
    var sectionMap = [];
    
    var sectionElements = $('#section_map').find('.section');
    sectionElementCount = 0;
    
    sectionElements.each(function()
    {
        var section = {uid: $(this).attr('id').split('section_').join(''), children: []};
        
        var subsectionElements = $(this).find('.subsection');
        subsectionElementCount = 0;
        
        if(subsectionElements.length == 0)
        {
            sectionMap.push(section);
            sectionElementCount++;
            if(sectionElementCount >= sectionElements.length)
            {
                saveSectionMap(sectionMap);
            }
        }
        else
        {        
            subsectionElements.each(function()
            {
                section.children.push({uid: $(this).attr('id').split('subsection_').join('')});
                subsectionElementCount++;
                if(subsectionElementCount >= subsectionElements.length)
                {
                    sectionMap.push(section);
                    sectionElementCount++;
                    if(sectionElementCount >= sectionElements.length)
                    {
                        saveSectionMap(sectionMap);
                    }
                }
            });
        }
    });
}

function saveSectionMap(sectionMap)
{
    $('fieldset').prepend('<input type="text" id="map" name="map" value="' + encodeURIComponent(JSON.stringify(sectionMap)) + '" style="display: none"></input>');
    $('#section_map_form').submit();
}

function confirmDeleteSection(sectionID, sectionName)
{
    $('#delete_name').html(sectionName);
    $('#delete_button').attr('onclick', 'window.location = "/actions/admin/content/sections/delete_section/' + sectionID + '"');
    $('#confirm_delete_modal').modal({backdrop: 'static', keyboard: true});
}
