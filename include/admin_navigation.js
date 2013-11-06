global.getAdminNavigation = function(template, activePage)
{
    var navItems = ['^dashboard^', '^pages^', '^posts^', '^sections^', '^plugins^', '^users^', '^settings^'];
    
    for(var i = 0; i < navItems.length; i++)
    {
        if(navItems[i].indexOf(activePage) > -1)
        {
            template = template.split(navItems[i]).join('active');
            continue;
        }
        
        template = template.split(navItems[i]).join('');
    }
    
    return template;
}
