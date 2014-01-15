function activateThemePill(theme)
{
    $('#sub_nav li').each(function()
    {
        $(this).attr('class', '');
    });
    
    $('#' + theme + '_pill').attr('class', 'active');
}
