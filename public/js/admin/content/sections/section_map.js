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

function editSection(siteRoot, sectionID)
{
    $('#sections_content').html('<div class="row" style="padding-top: 100px;"><div class="col-md-4 col-md-offset-4"><div class="progress progress-striped active"><div class="progress-bar"  role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style="width: 100%"></div></div></div></div>');
    $('#sections_content').load(siteRoot + '/admin/content/sections/edit_section?id=' + sectionID);
    
    $('#sub_nav li').each(function()
    {
        $(this).attr('class', '');
    });
}

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

function confirmDeleteSection(siteRoot, sectionID, sectionName)
{
    $('#delete_name').html(sectionName);
    $('#delete_button').attr('onclick', 'window.location = "' + siteRoot + '/actions/admin/content/sections/delete_section?id=' + sectionID + '"');
    $('#confirm_delete_modal').modal({backdrop: 'static', keyboard: true});
}
