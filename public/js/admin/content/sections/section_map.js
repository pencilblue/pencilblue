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
