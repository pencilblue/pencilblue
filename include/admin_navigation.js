/*
 Copyright (C) 2014  PencilBlue, LLC

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * Provides function to construct the structure needed to display the navigation
 * in the Admin section of the application.
 *
 * @module Services
 * @submodule Admin
 * @class AdminNavigation
 * @constructor
 */
function AdminNavigation() {
}

AdminNavigation.navigation = null;
AdminNavigation.additions = [];
AdminNavigation.childrenAdditions = {};

/**
 *
 * @returns {*[]}
 */
function getDefaultNavigation() {
    return [
        {
            id: 'content',
            title: 'CONTENT',
            icon: 'quote-right',
            href: '#',
            access: ACCESS_WRITER,
            children: [
                {
                    id: 'sections',
                    title: 'NAVIGATION',
                    icon: 'th-large',
                    href: '/admin/content/sections/section_map',
                    access: ACCESS_EDITOR
                },
                {
                    id: 'topics',
                    title: 'TOPICS',
                    icon: 'tags',
                    href: '/admin/content/topics/manage_topics',
                    access: ACCESS_EDITOR
                },
                {
                    id: 'pages',
                    title: 'PAGES',
                    icon: 'file-o',
                    href: '/admin/content/pages/manage_pages',
                    access: ACCESS_EDITOR
                },
                {
                    id: 'articles',
                    title: 'ARTICLES',
                    icon: 'files-o',
                    href: '/admin/content/articles/manage_articles',
                    access: ACCESS_WRITER
                },
                {
                    id: 'media',
                    title: 'MEDIA',
                    icon: 'camera',
                    href: '/admin/content/media/manage_media',
                    access: ACCESS_WRITER
                },
                {
                    id: 'comments',
                    title: 'COMMENTS',
                    icon: 'comments',
                    href: '/admin/content/comments/manage_comments',
                    access: ACCESS_EDITOR
                },
                {
                    id: 'custom_objects',
                    title: 'CUSTOM_OBJECTS',
                    icon: 'sitemap',
                    href: '/admin/content/custom_objects/manage_object_types',
                    access: ACCESS_EDITOR
                }
            ]
        },
        {
            id: 'plugins',
            title: 'PLUGINS',
            icon: 'puzzle-piece',
            href: '#',
            access: ACCESS_ADMINISTRATOR,
            children: [
                {
                    divider: true,
                    id: 'manage',
                    title: 'MANAGE',
                    icon: 'upload',
                    href: '/admin/plugins'
                },
                {
                    id: 'themes',
                    title: 'THEMES',
                    icon: 'magic',
                    href: '/admin/themes'
                }
            ]
        },
        {
            id: 'users',
            title: 'USERS',
            icon: 'users',
            href: '#',
            access: ACCESS_EDITOR,
            children: [
                {
                    id: 'manage',
                    title: 'MANAGE',
                    icon: 'users',
                    href: '/admin/users/manage_users',
                    access: ACCESS_EDITOR
                },
                {
                    id: 'permissions',
                    title: 'PERMISSIONS',
                    icon: 'lock',
                    href: '/admin/users/permissions',
                    access: ACCESS_ADMINISTRATOR
                },
            ]
        },
        {
            id: 'settings',
            title: 'SETTINGS',
            icon: 'cogs',
            href: '#',
            access: ACCESS_WRITER,
            children: [
                {
                    id: 'site_settings',
                    title: 'SITE_SETTINGS',
                    icon: 'cog',
                    href: '/admin/site_settings/configuration',
                    access: ACCESS_MANAGING_EDITOR
                },
                {
                    divider: true,
                    id: 'logout',
                    title: 'LOGOUT',
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
 * @returns {*}
 */
function getAdditions() {
    return pb.utils.clone(AdminNavigation.additions);
};

/**
 *
 * @returns {*}
 */
function getChildrenAdditions() {
    return pb.utils.clone(AdminNavigation.childrenAdditions);
};

/**
 *
 * @returns {Array}
 */
function buildNavigation() {
    var i;
    var navigation = [];
    var defaultNavigation = getDefaultNavigation();
    var additions = getAdditions();
    var childrenAdditions = getChildrenAdditions();

    pb.utils.arrayPushAll(defaultNavigation, navigation);
    pb.utils.arrayPushAll(additions, navigation);

    for (var id in childrenAdditions) {
        var children = childrenAdditions[id];

        for (i = 0; i < navigation.length; i++) {
            if (navigation[i].id == id) {
                if (!navigation[i].children) {
                    navigation[i].children = [];
                }

                for (var j = 0; j < children.length; j++) {
                    navigation[i].children.push(children[j]);
                }
                break;
            }
        }
    }

    return navigation;
};

/**
 *
 * @param navigation
 * @param ls
 * @returns {*}
 */
function localizeNavigation(navigation, ls) {
    for(var i = 0; i < navigation.length; i++) {
        navigation[i].title = ls.get(navigation[i].title);
        if(navigation[i].children) {
            navigation[i].children = localizeNavigation(navigation[i].children, ls);
        }
    }

    return navigation;
};

/**
 *
 * @param id
 * @param navigation
 * @returns {boolean}
 */
function isDuplicate(id, navigation) {
    if (!navigation) {
        navigation = buildNavigation();
    }

    for (var i = 0; i < navigation.length; i++) {
        var node = navigation[i];

        if (node.id == id) {
            return true;
        }

        if (node.children && isDuplicate(id, node.children)) {
            return true;
        }
    }

    return false;
};

function isDefaultNode(id) {
    return isDuplicate(id, getDefaultNavigation());
};

/**
 * Retrive the admin navigation hierarchy
 *
 * @method get
 * @param {object} session
 * @param {array} activeMenuItems Array of nav item names that are active
 * @param {Object} ls Localization service
 * @return {object} Admin navigation
 */
AdminNavigation.get = function (session, activeMenuItems, ls) {
    var navigation = AdminNavigation.removeUnauthorized(
        session,
        buildNavigation(),
        activeMenuItems
    );

    return localizeNavigation(navigation, ls);
};

/**
 * Adds a new child node to an existing top level node
 *
 * @method addChild
 * @param parentId
 * @param node
 * @returns {boolean}
 */
AdminNavigation.addChild = function (parentId, node) {
    if (isDuplicate(node.id)) {
        return false;
    }

    if (!AdminNavigation.childrenAdditions[parentId]) {
        AdminNavigation.childrenAdditions[parentId] = [];
    }

    AdminNavigation.childrenAdditions[parentId].push(node);
    return true;
};

/**
 * Adds a new top level node
 *
 * @method add
 * @param node
 * @returns {boolean}
 */
AdminNavigation.add = function (node) {
    if (isDuplicate(node.id)) {
        return false;
    }

    AdminNavigation.additions.push(node);
    return true;
};

/**
 * Remove a navigation node
 *
 * @param id
 * @param navigation
 * @returns {boolean}
 */
AdminNavigation.remove = function (id) {
    if (!isDuplicate(id, buildNavigation())) {
        return false;
    }

    if (isDefaultNode(id)) {
        pb.log.warn("Admin Navigation: Attempting to remove default Node %s", id);
        return false;
    }

    function removeNode(id, navigation) {
        for (var i = 0; i < navigation.length; i++) {
            if (navigation[i].id == id) {
                navigation.splice(i, 1);
                return navigation;
            }

            if (navigation[i].children) {
                navigation[i].children = removeNode(id, navigation[i].children);
            }
        }

        return navigation;
    }

    AdminNavigation.additions = removeNode(id, AdminNavigation.additions);

    for (var parentId in AdminNavigation.childrenAdditions) {
        AdminNavigation.childrenAdditions[parentId] = removeNode(id, AdminNavigation.childrenAdditions[parentId]);
    }

    return true;
};

/**
 * @param session
 * @param adminNavigation
 * @param activeItems
 * @returns {*}
 */
AdminNavigation.removeUnauthorized = function (session, adminNavigation, activeItems) {
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