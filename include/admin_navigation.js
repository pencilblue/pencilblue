/*
 Copyright (C) 2015  PencilBlue, LLC

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

//dependencies
var util = require('./util.js');

module.exports = function AdminNavigationModule(pb) {

    //PB dependencies
    var SecurityService = pb.SecurityService;
    var GLOBAL_SITE = pb.SiteService.GLOBAL_SITE;

    /**
     * Provides function to construct the structure needed to display the navigation
     * in the Admin section of the application.
     *
     * @module Services
     * @submodule Admin
     * @class AdminNavigation
     * @constructor
     */
    function AdminNavigation() {}

    /**
     *
     * @private
     * @static
     * @property additions
     * @type {Array}
     */
    AdminNavigation.additions = {};

    /**
     *
     * @private
     * @static
     * @property childrenAdditions
     * @type {Object}
     */
    AdminNavigation.childrenAdditions = {};

    /**
     *
     * @private
     * @static
     * @readonly
     * @property MULTISITE_NAV
     * @returns {Array}
     */
    var MULTISITE_NAV = Object.freeze({
            id: 'site_entity',
            title: 'MANAGE_SITES',
            icon: 'sitemap',
            href: '/admin/sites',
            access: SecurityService.ACCESS_ADMINISTRATOR

        }
    );

    /**
     *
     * @private
     * @static
     * @readonly
     * @property CONTENT_NAV
     * @returns {Array}
     */
    var CONTENT_NAV = Object.freeze({
        id: 'content',
        title: 'CONTENT',
        icon: 'quote-right',
        href: '#',
        access: SecurityService.ACCESS_WRITER,
        children: [
            {
                id: 'navigation',
                title: 'NAVIGATION',
                icon: 'th-large',
                href: '/admin/content/navigation',
                access: SecurityService.ACCESS_EDITOR
            },
            {
                id: 'topics',
                title: 'TOPICS',
                icon: 'tags',
                href: '/admin/content/topics',
                access: SecurityService.ACCESS_EDITOR
            },
            {
                id: 'pages',
                title: 'PAGES',
                icon: 'file-o',
                href: '/admin/content/pages',
                access: SecurityService.ACCESS_EDITOR
            },
            {
                id: 'articles',
                title: 'ARTICLES',
                icon: 'files-o',
                href: '/admin/content/articles',
                access: SecurityService.ACCESS_WRITER
            },
            {
                id: 'media',
                title: 'MEDIA',
                icon: 'camera',
                href: '/admin/content/media',
                access: SecurityService.ACCESS_WRITER
            },
            {
                id: 'comments',
                title: 'COMMENTS',
                icon: 'comments',
                href: '/admin/content/comments',
                access: SecurityService.ACCESS_EDITOR
            },
            {
                id: 'custom_objects',
                title: 'CUSTOM_OBJECTS',
                icon: 'cubes',
                href: '/admin/content/objects/types',
                access: SecurityService.ACCESS_EDITOR
            }
        ]
    });

    var PLUGINS_NAV = Object.freeze({
        id: 'plugins',
        title: 'PLUGINS',
        icon: 'puzzle-piece',
        href: '#',
        access: SecurityService.ACCESS_ADMINISTRATOR,
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
    });

    var USERS_NAV = Object.freeze({
        id: 'users',
        title: 'USERS',
        icon: 'users',
        href: '#',
        access: SecurityService.ACCESS_EDITOR,
        children: [
            {
                id: 'manage',
                title: 'MANAGE',
                icon: 'users',
                href: '/admin/users',
                access: SecurityService.ACCESS_EDITOR
            },
            {
                id: 'permissions',
                title: 'PERMISSIONS',
                icon: 'lock',
                href: '/admin/users/permissions',
                access: SecurityService.ACCESS_ADMINISTRATOR
            }
        ]
    });

    var VIEW_SITE_NAV = Object.freeze({
        id: 'view_site',
        title: 'VIEW_SITE',
        icon: 'desktop',
        href: '/',
        access: SecurityService.ACCESS_WRITER
    });

    var LOGOUT_NAV = Object.freeze({
        id: 'logout',
        title: 'LOGOUT',
        icon: 'power-off',
        href: '/actions/logout',
        access: SecurityService.ACCESS_WRITER
    });

    function buildSettingsNavigation(site) {
        var settingsNav = {
            id: 'settings',
            title: 'SETTINGS',
            icon: 'cogs',
            href: '#',
            access: SecurityService.ACCESS_ADMINISTRATOR,
            children: [
                {
                    id: 'site_settings',
                    title: 'SITE_SETTINGS',
                    icon: 'cog',
                    href: '/admin/site_settings',
                    access: SecurityService.ACCESS_ADMINISTRATOR
                },
                {
                    id: 'content_settings',
                    title: 'CONTENT',
                    icon: 'quote-right',
                    href: '/admin/site_settings/content',
                    access: SecurityService.ACCESS_ADMINISTRATOR
                },
                {
                    id: 'email_settings',
                    title: 'EMAIL',
                    icon: 'envelope',
                    href: '/admin/site_settings/email',
                    access: SecurityService.ACCESS_ADMINISTRATOR
                }
            ]
        };

        if (pb.SiteService.isGlobal(site)) {
            settingsNav.children.push({
                id: 'library_settings',
                title: 'LIBRARIES',
                icon: 'book',
                href: '/admin/site_settings/libraries',
                access: SecurityService.ACCESS_ADMINISTRATOR
            });
        }
        return Object.freeze(settingsNav);
    }

    function getDefaultNavigation(site) {
        return util.clone([CONTENT_NAV, PLUGINS_NAV, USERS_NAV, buildSettingsNavigation(site), VIEW_SITE_NAV, LOGOUT_NAV]);
    }

    function getMultiSiteNavigation() {
        return util.clone([MULTISITE_NAV]);
    }

    function getGlobalScopeNavigation(site) {
        return util.clone([PLUGINS_NAV, USERS_NAV, buildSettingsNavigation(site), LOGOUT_NAV]);
    }


    /**
     *
     * @private
     * @static
     * @method getAdditions
     * @return {Array}
     */
    function getAdditions(site) {
        return getAdditionsInScope(AdminNavigation.additions, site);
    }

    /**
     *
     * @private
     * @static
     * @method getChildrenAdditions
     * @return {Object}
     */
    function getChildrenAdditions(site) {
        return getAdditionsInScope(AdminNavigation.childrenAdditions, site);
    }

    /**
     * @private
     * @method getAdditionsInScope
     * @param {Object} additions
     * @param {String} site
     */
    function getAdditionsInScope(additions, site) {
        if (additions.hasOwnProperty(site)) {
            return util.clone(additions[site]);
        }
        else if (additions.hasOwnProperty(pb.SiteService.GLOBAL_SITE)) {
            return util.clone(additions[pb.SiteService.GLOBAL_SITE]);
        }
        return util.clone(additions);
    }

    /**
     *
     * @private
     * @static
     * @method buildNavigation
     * @return {Array}
     */
    function buildNavigation(site) {
        var i;
        var navigation = [];
        var additions = getAdditions(site);
        var childrenAdditions = getChildrenAdditions(site);

        if (pb.config.multisite.enabled) {
            var multiSiteAdditions = getMultiSiteNavigation();
            util.arrayPushAll(multiSiteAdditions, navigation);
        }

        if (pb.config.multisite.enabled && pb.SiteService.isGlobal(site)) {
            // Don't include content or view site in the nav for multitenancy global scope.
            util.arrayPushAll(getGlobalScopeNavigation(site), navigation);
        }
        else {
            var defaultNavigation = getDefaultNavigation(site);
            util.arrayPushAll(defaultNavigation, navigation);
        }

        util.arrayPushAll(additions, navigation);

        //retrieve the nav items to iterate over
        var ids = Object.keys(childrenAdditions);
        if (ids.length === 0) {
            return navigation;
        }

        //convert to hash to create quick lookup
        var lookup = util.arrayToHash(navigation, function(navigation, i) {
            return navigation[i].id;
        });

        //add additions
        Object.keys(childrenAdditions).forEach(function(id) {
            var children = childrenAdditions[id];

            //find the nav that the children should be added to
            var nav = lookup[id];
            if (!nav) {
                return;
            }


            if (!util.isArray(nav.children)) {
                nav.children = [];
            }
            util.arrayPushAll(children, nav.children);
        });

        return navigation;
    }

    /**
     * @private
     * @static
     * @method localizeNavigation
     * @param navigation
     * @param ls
     * @return {*}
     */
    function localizeNavigation(navigation, ls) {
        navigation.forEach(function(nav) {
            nav.title = ls.get(nav.title);
            if(util.isArray(nav.children)) {
                nav.children = localizeNavigation(nav.children, ls);
            }
        });
        return navigation;
    }

    /**
     * @private
     * @static
     * @method isDuplicate
     * @param {String} id
     * @param {Array} navigation
     * @return {boolean}
     */
    function isDuplicate(id, navigation, site) {
        if (!navigation) {
            navigation = buildNavigation(site);
        }

        for (var i = 0; i < navigation.length; i++) {
            var node = navigation[i];

            if (node.id === id) {
                return true;
            }
            if (node.children && isDuplicate(id, node.children, site)) {
                return true;
            }
        }
        return false;
    }

    function exists(id, site) {
        var isGlobal = pb.SiteService.isGlobal(site);
        var nav = buildNavigation(site);
        return isDuplicate(id, nav) ||
          (!isGlobal && isDuplicate(id, buildNavigation(pb.SiteService.GLOBAL_SITE)));
    }

    /**
     * @private
     * @static
     * @method isDefaultNode
     * @param {String} id
     * @return {Boolean}
     */
    function isDefaultNode(id, site) {
        return isDuplicate(id, getDefaultNavigation(site));
    }

    /**
     * Retrive the admin navigation hierarchy
     * @static
     * @method get
     * @param {object} session
     * @param {array} activeMenuItems Array of nav item names that are active
     * @param {Object} ls Localization service
     * @return {object} Admin navigation
     */
    AdminNavigation.get = function (session, activeMenuItems, ls, site) {
        var navigation = AdminNavigation.removeUnauthorized(
            session,
            buildNavigation(site),
            activeMenuItems
        );

        return localizeNavigation(navigation, ls);
    };

    AdminNavigation.addChild = function(parentId, node) {
        AdminNavigation.addChildToSite(parentId, node, pb.SiteService.GLOBAL_SITE);
    }

    /**
     * Adds a new child node to an existing top level node
     * @static
     * @method addChildToSite
     * @param {String} parentId
     * @param {Object} node
     * @param {String} site - site unique id
     * @return {Boolean}
     */
    AdminNavigation.addChildToSite = function (parentId, node, site) {
        if (util.isNullOrUndefined(site)) {
            site = GLOBAL_SITE;
        }
        if (exists(node.id, site)) {
            return false;
        }

        var additionsMap;
        if (!(site in AdminNavigation.childrenAdditions)) {
            additionsMap = AdminNavigation.childrenAdditions[site] = {};
        } else {
            additionsMap = AdminNavigation.childrenAdditions[site];
        }

        if (!additionsMap[parentId]) {
            additionsMap[parentId] = [];
        }

        additionsMap[parentId].push(node);
        return true;
    };

    /**
     * Adds a new top level node
     * @static
     * @method add
     * @param {Object} node
     * @param {String} [site='global']
     * @return {Boolean}
     */
    AdminNavigation.add = function(node, site) {
        if (util.isNullOrUndefined(site)) {
            site = GLOBAL_SITE;
        }
        if (exists(node.id, site)) {
            return false;
        }

        if (!(site in AdminNavigation.additions)) {
            AdminNavigation.additions[site] = [];
        }
        AdminNavigation.additions[site].push(node);
        return true;
    };

    /**
     * Adds a new top level node
     * @static
     * @method addToSite
     * @param {Object} node
     * @param {String} site
     * @return {Boolean}
     */
    AdminNavigation.addToSite = function (node, site) {
        return AdminNavigation.add(node, site);
    };

    /**
     * Remove a navigation node
     * @static
     * @method remove
     * @param id
     * @param {String} [site='global']
     * @return {boolean}
     */
    AdminNavigation.remove = function(id, site) {
        if (util.isNullOrUndefined(site)) {
            site = GLOBAL_SITE;
        }
        if (!isDuplicate(id, buildNavigation(site))) {
            return false;
        }

        if (isDefaultNode(id)) {
            pb.log.warn("Admin Navigation: Attempting to remove default Node %s", id);
            return false;
        }

        function removeNode(id, navigation) {
            for (var i = 0; i < navigation.length; i++) {
                if (navigation[i].id === id) {
                    navigation.splice(i, 1);
                    return navigation;
                }

                if (navigation[i].children) {
                    navigation[i].children = removeNode(id, navigation[i].children);
                }
            }

            return navigation;
        }

        AdminNavigation.additions[site] = removeNode(id, AdminNavigation.additions[site]);

        var childAdditionsMap = AdminNavigation.childrenAdditions[site];
        util.forEach(childAdditionsMap, function(value, key) {
            if(key === id){
                delete childAdditionsMap[key];
            }else {
                childAdditionsMap[key] = removeNode(id, value);
            }
        });

        return true;
    };

    /**
     * Remove a navigation node
     * @static
     * @method removeFromSite
     * @param id
     * @param {String} site
     * @return {boolean}
     */
    AdminNavigation.removeFromSite = function (id, site) {
        return AdminNavigation.remove(id, site);
    };

    /**
     * @static
     * @method removeUnauthorized
     * @param {Object} session
     * @param {Array} adminNavigation
     * @param {Array} activeItems
     * @return {Array}
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
                if (activeItems[o] === adminNavigation[i].id) {
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

                        for (var p = 0; p < activeItems.length; p++) {
                            if (activeItems[p] == adminNavigation[i].children[j].id) {
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
    return AdminNavigation;
};
