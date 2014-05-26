/**
 * Provides function to construct the structure needed to display the navigation 
 * in the Admin section of the application.
 * 
 * @class AdminNavigation
 * @constructor
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright 2014 PencilBlue, LLC.
 */
function AdminNavigation(){}

/**
 * @private
 * @method getDefaultNavigation
 * @param {Localization} ls
 * @return {object} 
 */
function getDefaultNavigation(ls) {
	return [
        {
            id: 'content',
            title: ls.get('CONTENT'),
            icon: 'quote-right',
            href: '#',
            access: ACCESS_WRITER,
            children:
            [
                {
                    id: 'sections',
                    title: ls.get('NAVIGATION'),
                    icon: 'th-large',
                    href: '/admin/content/sections/section_map',
                    access: ACCESS_EDITOR
                },
                {
                    id: 'topics',
                    title: ls.get('TOPICS'),
                    icon: 'tags',
                    href: '/admin/content/topics/manage_topics',
                    access: ACCESS_EDITOR
                },
                {
                    id: 'pages',
                    title: ls.get('PAGES'),
                    icon: 'file-o',
                    href: '/admin/content/pages/manage_pages',
                    access: ACCESS_EDITOR
                },
                {
                    id: 'articles',
                    title: ls.get('ARTICLES'),
                    icon: 'files-o',
                    href: '/admin/content/articles/manage_articles',
                    access: ACCESS_WRITER
                },
                {
                    id: 'media',
                    title: ls.get('MEDIA'),
                    icon: 'camera',
                    href: '/admin/content/media/manage_media',
                    access: ACCESS_WRITER
                },
                {
                    id: 'custom_objects',
                    title: ls.get('CUSTOM_OBJECTS'),
                    icon: 'sitemap',
                    href: '/admin/content/custom_objects/manage_object_types',
                    access: ACCESS_EDITOR
                }
            ]
        },
        {
            id: 'plugins',
            title: ls.get('PLUGINS'),
            icon: 'puzzle-piece',
            href: '#',
            access: ACCESS_MANAGING_EDITOR,
            children:
            [
                {
	                divider: true,
	                id: 'manage',
	                title: ls.get('MANAGE'),
	                icon: 'upload',
	                href: '/admin/plugins'
	            },
	            {
	                id: 'themes',
	                title: ls.get('THEMES'),
	                icon: 'magic',
	                href: '/admin/themes'
	            }
            ]
        },
        {
            id: 'users',
            title: ls.get('USERS'),
            icon: 'users',
            href: '#',
            access: ACCESS_EDITOR,
            children:
            [
                {
                    id: 'manage',
                    title: ls.get('MANAGE'),
                    icon: 'users',
                    href: '/admin/users/manage_users',
                    access: ACCESS_EDITOR
                },
                {
                    id: 'permissions',
                    title: ls.get('PERMISSIONS'),
                    icon: 'lock',
                    href: '/admin/users/permissions',
                    access: ACCESS_ADMINISTRATOR
                },
            ]
        },
        {
            id: 'settings',
            title: ls.get('SETTINGS'),
            icon: 'cogs',
            href: '#',
            access: ACCESS_WRITER,
            children:
            [
                {
                    id: 'site_settings',
                    title: ls.get('SITE_SETTINGS'),
                    icon: 'cog',
                    href: '/admin/site_settings/configuration',
                    access: ACCESS_MANAGING_EDITOR
                },
                {
                    id: 'account',
                    title: ls.get('ACCOUNT'),
                    icon: 'user',
                    href: '/user/manage_account',
                    access: ACCESS_WRITER
                },
                {
                    divider: true,
                    id: 'logout',
                    title: ls.get('LOGOUT'),
                    icon: 'power-off',
                    href: '/actions/logout',
                    access: ACCESS_WRITER
                }
            ]
        }
    ];
}

/**
 * 
 * @static
 * @method get
 * @param {object} session
 * @param {array} activeMenuItems
 * @param {Localization} ls
 * @returns {object}
 */
AdminNavigation.get = function(session, activeMenuItems, ls) {
    return AdminNavigation.removeUnauthorized(
		session, 
		getDefaultNavigation(ls), 
		activeMenuItems
	);
};

/**
 * 
 * @static
 * @method removeUnathorized
 * @param session
 * @param adminNavigation
 * @param activeItems
 * @returns {object}
 */
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
