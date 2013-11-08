function editSection(siteRoot, sectionID)
{
    $('#sections_content').html('<div class="progress progress-striped active" style="width: 50%"><div class="progress-bar"  role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style="width: 100%"></div></div>');
    $('#sections_content').load(siteRoot + '/admin/content/sections/edit_section?id=' + sectionID);
    
    $('#sub_nav li').each(function()
    {
        $(this).attr('class', '');
    });
}
