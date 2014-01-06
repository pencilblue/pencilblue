global.getAdminNavigation = function(session, activeMenuItems, output)
{
    var adminNavigation = removeUnauthorizedAdminNavigation(session, defaultAdminNavigation);
    var buttonTemplate = '';
    var dropdownTemplate = '';
    var navLayout = '';
    
    getHTMLTemplate('admin/elements/admin_nav/button', null, null, function(data)
    {
        buttonTemplate = data;
        
        getHTMLTemplate('admin/elements/admin_nav/dropdown', null, null, function(data)
        {
            dropdownTemplate = data;
            
            for(var i = 0; i < adminNavigation.length; i++)
            {
                if(typeof adminNavigation[i].children === 'undefined')
                {
                    navLayout = navLayout.concat(getAdminNavigationItem(buttonTemplate, adminNavigation[i], activeMenuItems));
                }
                else
                {
                    var dropdown = getAdminNavigationItem(dropdownTemplate, adminNavigation[i], activeMenuItems);
                    var items = '';
                    for(var j = 0; j < adminNavigation[i].children.length; j++)
                    {
                        items = items.concat(getAdminNavigationItem(buttonTemplate, adminNavigation[i].children[j], activeMenuItems));
                    }
                    
                    dropdown = dropdown.split('^children^').join(items);
                    navLayout = navLayout.concat(dropdown);
                }
            }
            
            output(navLayout);
        });
    });
}

global.removeUnauthorizedAdminNavigation = function(session, adminNavigation)
{
    for(var i = 0; i < adminNavigation.length; i++)
    {
        if(typeof adminNavigation[i].access !== 'undefined')
        {
            if(!userIsAuthorized(session, {admin_level: adminNavigation[i].access}))
            {
                adminNavigation.splice(i, 1);
                i--;
                continue;
            }
        }
        
        if(typeof adminNavigation[i].children !== 'undefined')
        {
            for(var j = 0; j < adminNavigation[i].children.length; j++)
            {
                if(typeof adminNavigation[i].children[j].access !== 'undefined')
                {
                    if(!userIsAuthorized(session, {admin_level: adminNavigation[i].children[j].access}))
                    {
                        adminNavigation[i].children.splice(j, 1);
                        j--;
                        continue;
                    }
                }
            }
        }
    }
    
    return adminNavigation;
}

global.getAdminNavigationItem = function(template, itemData, activeItems)
{
    var active = '';
    for(var i = 0; i < activeItems.length; i++)
    {
        if(activeItems[i] == itemData.id)
        {
            active = 'active';
            break;
        }
    }
    
    if(itemData.href.substr(0, 1) == '#')
    {
        var href = itemData.href;
    }
    else if(itemData.href.indexOf('http://') > -1 || itemData.href.indexOf('https://') > -1)
    {
        var href = itemData.href;
    }
    else
    {
        var href = pb.config.siteRoot + itemData.href;
    }

    var item = template.split('^nav_icon^').join(itemData.icon);
    item = item.split('^nav_title^').join(itemData.title);
    item = item.split('^nav_active^').join(active);
    item = item.split('^nav_href^').join(href);
    
    if(itemData.divider)
    {
        item = '<li class="divider"></li>' + item;
    }
    
    return item;
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

global.getTabNav = function(tabs, output)
{
    var tabTemplate = '';
    var tabNav = '';
    
    getHTMLTemplate('admin/elements/tab_nav', null, null, function(data)
    {
        tabNav = data;
        
        getHTMLTemplate('admin/elements/tab_nav/tab', null, null, function(data)
        {
            tabTemplate = data;
            
            var tabLayout = '';
            for(var i = 0; i < tabs.length; i++)
            {
                var tab = tabTemplate.split('^tab_active^').join((tabs[i].active) ? ' class="active"' : '');
                tab = tab.split('^tab_onclick^').join((tabs[i].onclick) ? ' onclick="' + tabs[i].onclick + '"' : '');
                tab = tab.split('^tab_href^').join(tabs[i].href);
                tab = tab.split('^tab_icon^').join(tabs[i].icon);
                tab = tab.split('^tab_title^').join(tabs[i].title);
                
                tabLayout = tabLayout.concat(tab);
            }
            
            tabNav = tabNav.split('^tabs^').join(tabLayout);
            
            output(tabNav);
        });
    });
}

// Defines the default admin nav
global.defaultAdminNavigation =
[
    {
        id: 'content',
        title: '^loc_CONTENT^',
        icon: 'quote-right',
        href: '#',
        access: ACCESS_WRITER,
        children:
        [
            {
                id: 'sections',
                title: '^loc_SECTIONS^',
                icon: 'th-large',
                href: '/admin/content/sections',
                access: ACCESS_EDITOR
            },
            {
                id: 'topics',
                title: '^loc_TOPICS^',
                icon: 'tags',
                href: '/admin/content/topics',
                access: ACCESS_EDITOR
            },
            {
                id: 'pages',
                title: '^loc_PAGES^',
                icon: 'file-o',
                href: '/admin/content/pages',
                access: ACCESS_EDITOR
            },
            {
                id: 'articles',
                title: '^loc_ARTICLES^',
                icon: 'files-o',
                href: '/admin/content/articles',
                access: ACCESS_WRITER
            },
            {
                id: 'media',
                title: '^loc_MEDIA^',
                icon: 'camera',
                href: '/admin/content/media',
                access: ACCESS_WRITER
            }
        ]
    },
    {
        id: 'plugins',
        title: '^loc_PLUGINS^',
        icon: 'puzzle-piece',
        href: '#',
        access: ACCESS_MANAGING_EDITOR,
        children:
        [
            {
                id: 'themes',
                title: '^loc_THEMES^',
                icon: 'magic',
                href: '/admin/plugins/themes'
            },
            {
                id: 'frontend_plugins',
                title: '^loc_FRONTEND^',
                icon: 'tint',
                href: '#'
            },
            {
                id: 'backend_plugins',
                title: '^loc_BACKEND^',
                icon: 'terminal',
                href: '#'
            },
            {
                divider: true,
                id: 'install_plugin',
                title: '^loc_INSTALL_PLUGIN^',
                icon: 'upload',
                href: '#'
            }
        ]
    },
    {
        id: 'users',
        title: '^loc_USERS^',
        icon: 'users',
        href: '/admin/users',
        access: ACCESS_EDITOR
    },
    {
        id: 'settings',
        title: '^loc_SETTINGS^',
        icon: 'cogs',
        href: '#',
        access: ACCESS_WRITER,
        children:
        [
            {
                id: 'site_settings',
                title: '^loc_SITE_SETTINGS^',
                icon: 'cog',
                href: '#',
                access: ACCESS_MANAGING_EDITOR
            },
            {
                id: 'account',
                title: '^loc_ACCOUNT^',
                icon: 'user',
                href: '#',
                access: ACCESS_WRITER
            },
            {
                divider: true,
                id: 'logout',
                title: '^loc_LOGOUT^',
                icon: 'power-off',
                href: '/actions/logout',
                access: ACCESS_WRITER
            }
        ]
    }
];
