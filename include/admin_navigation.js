global.getAdminNavigation = function(template, activeMenuItems)
{
    var navItems = ['^dashboard^', '^content^', '^sections^', '^pages^', '^articles^', '^plugins^', '^themes^', '^users^', '^new_user^', '^settings^'];
    
    for(var i = 0; i < navItems.length; i++)
    {
        var activeMatch = false;
        for(var j = 0; j < activeMenuItems.length; j++)
        {
            if(navItems[i].indexOf(activeMenuItems[j]) > -1)
            {
                template = template.split(navItems[i]).join('active');
                activeMatch = true;
                break;
            }            
        }
        
        if(!activeMatch)
        {
            template = template.split(navItems[i]).join('');
        }
    }
    
    return template;
}
