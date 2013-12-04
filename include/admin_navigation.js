global.getAdminNavigation = function(template, activeMenuItems)
{
    var navItems = ['^dashboard^', '^content^', '^sections^', '^topics^', '^pages^', '^articles^', '^plugins^', '^themes^', '^users^', '^settings^'];
    
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

global.getPillNavContainer = function(options, output)
{
    var pillTemplate = '';
    var pillNav = '';
    
    getHTMLTemplate('admin/elements/pill_nav_container', null, null, function(data)
    {
        pillNav = data;
        
        getHTMLTemplate('admin/elements/pill_nav_container/pill', null, null, function(data)
        {
            pillTemplate = data;
            
            var pills = '';
            for(var i = 0; i < options.children.length; i++)
            {
                var pill = pillTemplate.split('^pill_child^').join(options.children[i].name);
                pill = pill.split('^pill_folder^').join(options.children[i].folder);
                pill = pill.split('^pill_icon^').join(options.children[i].icon);
                pill = pill.split('^pill_title^').join(options.children[i].title);
                
                pills = pills.concat(pill);
            }
            
            pillNav = pillNav.split('^pills^').join(pills);
            pillNav = pillNav.split('^pill_parent^').join(options.name);
            
            output(pillNav);
        });
    });
}
