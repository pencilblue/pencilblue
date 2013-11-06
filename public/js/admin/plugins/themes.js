function loadThemeSettings(siteRoot, theme)
{
    $('#settings_content').html('<div class="progress progress-striped active" style="width: 50%"><div class="progress-bar"  role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style="width: 100%"></div></div>');
    $('#settings_content').load(siteRoot + '/admin/' + theme + '_settings');
    
    $('#sub_nav li').each(function()
    {
        $(this).attr('class', '');
    });
    
    $('#' + theme + '_pill').attr('class', 'active');
}
