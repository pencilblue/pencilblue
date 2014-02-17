global.getAdminNavigation = function(session, activeMenuItems) {
    return removeUnauthorizedAdminNavigation(session, clone(defaultAdminNavigation), activeMenuItems);
};

global.removeUnauthorizedAdminNavigation = function(session, adminNavigation, activeItems) {
    
	for (var i = 0; i < adminNavigation.length; i++) {
        if (typeof adminNavigation[i].access !== 'undefined') {
            
        	if (!userIsAuthorized(session, {admin_level: adminNavigation[i].access})) {
                adminNavigation.splice(i, 1);
                i--;
                continue;
            }
        }
        
        for (var o = 0; o < activeItems.length; o++) {
            if (activeItems[o] == adminNavigation[i].id) {
                adminNavigation[i].active = 'active';
                break;
            }
        }
        
        if (typeof adminNavigation[i].children !== 'undefined') {
            if (adminNavigation[i].children.length > 0) {
                adminNavigation[i].dropdown = 'dropdown';
                
                for (var j = 0; j < adminNavigation[i].children.length; j++) {
                    
                	if (typeof adminNavigation[i].children[j].access !== 'undefined') {
                        
                		if (!userIsAuthorized(session, {admin_level: adminNavigation[i].children[j].access})) {
                            adminNavigation[i].children.splice(j, 1);
                            j--;
                            continue;
                        }
                    }
                    
                    for (var o = 0; o < activeItems.length; o++) {
                        if (activeItems[o] == adminNavigation[i].children[j].id) {
                            adminNavigation[i].children[j].active = 'active';
                            break;
                        }
                    }
                }
            }
        }
    }
    
    return adminNavigation;
};

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
                href: '/admin/content/sections/section_map',
                access: ACCESS_EDITOR
            },
            {
                id: 'topics',
                title: '^loc_TOPICS^',
                icon: 'tags',
                href: '/admin/content/topics/manage_topics',
                access: ACCESS_EDITOR
            },
            {
                id: 'pages',
                title: '^loc_PAGES^',
                icon: 'file-o',
                href: '/admin/content/pages/manage_pages',
                access: ACCESS_EDITOR
            },
            {
                id: 'articles',
                title: '^loc_ARTICLES^',
                icon: 'files-o',
                href: '/admin/content/articles/manage_articles',
                access: ACCESS_WRITER
            },
            {
                id: 'media',
                title: '^loc_MEDIA^',
                icon: 'camera',
                href: '/admin/content/media/manage_media',
                access: ACCESS_WRITER
            },
            {
                id: 'custom_objects',
                title: '^loc_CUSTOM_OBJECTS^',
                icon: 'sitemap',
                href: '/admin/content/custom_objects/manage_object_types',
                access: ACCESS_EDITOR
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
        href: '/admin/users/manage_users',
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
                href: '/admin/site_settings/configuration',
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

function AdminNavigation(){}

AdminNavigation.get = function(session, activeMenuItems) {
    return AdminNavigation.removeUnauthorized(
    		session, 
    		clone(defaultAdminNavigation), 
    		activeMenuItems
	);
};

AdminNavigation.removeUnauthorized = function(session, adminNavigation, activeItems) {
	for (var i = 0; i < adminNavigation.length; i++) {
        if (typeof adminNavigation[i].access !== 'undefined') {
            
        	if (!pb.security.isAuthorized(session, {admin_level: adminNavigation[i].access})) {
                adminNavigation.splice(i, 1);
                i--;
                continue;
            }
        }
        
        for (var o = 0; o < activeItems.length; o++) {
            if (activeItems[o] == adminNavigation[i].id) {
                adminNavigation[i].active = 'active';
                break;
            }
        }
        
        if (typeof adminNavigation[i].children !== 'undefined') {
            if (adminNavigation[i].children.length > 0) {
                adminNavigation[i].dropdown = 'dropdown';
                
                for (var j = 0; j < adminNavigation[i].children.length; j++) {
                    
                	if (typeof adminNavigation[i].children[j].access !== 'undefined') {
                        
                		if (!pb.security.isAuthorized(session, {admin_level: adminNavigation[i].children[j].access})) {
                            adminNavigation[i].children.splice(j, 1);
                            j--;
                            continue;
                        }
                    }
                    
                    for (var o = 0; o < activeItems.length; o++) {
                        if (activeItems[o] == adminNavigation[i].children[j].id) {
                            adminNavigation[i].children[j].active = 'active';
                            break;
                        }
                    }
                }
            }
        }
    }
    
    return adminNavigation;
};

//exports
module.exports.AdminNavigation = AdminNavigation;
