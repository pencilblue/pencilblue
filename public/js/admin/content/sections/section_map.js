$(document).ready(function()
{
    $('#section_map .panel-body').sortable({items: '.col-md-3', containment: 'document', cursor: 'move'});
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
