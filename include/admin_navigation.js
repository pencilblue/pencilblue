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
    var _ = require('lodash');
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
     * @property MULTISITE_NAV
     * @returns {Array}
     */
    var MULTISITE_NAV = Object.freeze([
        {
            id: 'site_entity',
            title: 'MANAGE_SITES',
            icon: 'sitemap',
            href: '/admin/sites',
            access: SecurityService.ACCESS_ADMINISTRATOR

        }
    ]);

    /**
     *
     * @private
     * @static
     * @method getDefaultNavigation
     * @param  adminsiteId {String} uid of site
     * @returns {Array}
     */
    function getDefaultNavigation() {
        return util.clone(Object.freeze([
            {
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
                        icon: 'sitemap',
                        href: '/admin/content/objects/types',
                        access: SecurityService.ACCESS_EDITOR
                    }
                ]
            },
            {
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
            },
            {
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
                    },
                ]
            },
            {
                id: 'settings',
                title: 'SETTINGS',
                icon: 'cogs',
                href: '#',
                access: SecurityService.ACCESS_WRITER,
                children: [
                    {
                        id: 'site_settings',
                        title: 'SITE_SETTINGS',
                        icon: 'cog',
                        href: '/admin/site_settings',
                        access: SecurityService.ACCESS_MANAGING_EDITOR
                    },
                    {
                        id: 'content_settings',
                        title: 'CONTENT',
                        icon: 'quote-right',
                        href: '/admin/site_settings/content',
                        access: SecurityService.ACCESS_MANAGING_EDITOR
                    },
                    {
                        id: 'email_settings',
                        title: 'EMAIL',
                        icon: 'envelope',
                        href: '/admin/site_settings/email',
                        access: SecurityService.ACCESS_MANAGING_EDITOR
                    },
                    {
                        id: 'library_settings',
                        title: 'LIBRARIES',
                        icon: 'book',
                        href: '/admin/site_settings/libraries',
                        access: SecurityService.ACCESS_ADMINISTRATOR
                    }
                ]
            },
            {
                id: 'view_site',
                title: 'VIEW_SITE',
                icon: 'desktop',
                href: '/',
                access: SecurityService.ACCESS_WRITER
            },
            {
                id: 'logout',
                title: 'LOGOUT',
                icon: 'power-off',
                href: '/actions/logout',
                access: SecurityService.ACCESS_WRITER
            }
        ]));
    }

    function getMultiSiteNavigation() {
        return util.clone(MULTISITE_NAV);
    }

    /**
     *
     * @private
     * @static
     * @method getAdditions
     * @returns {Array}
     */
    function getAdditions() {
        return util.clone(AdminNavigation.additions);
    };

    /**
     *
     * @private
     * @static
     * @method getChildrenAdditions
     * @returns {Object}
     */
    function getChildrenAdditions() {
        return util.clone(AdminNavigation.childrenAdditions);
    };

    /**
     *
     * @private
     * @static
     * @method buildNavigation
     * @returns {Array}
     */
    function buildNavigation(session) {
        var i;
        var navigation = [];
        var multiSiteAdditions = getMultiSiteNavigation();
        var defaultNavigation = getDefaultNavigation();
        var additions = getAdditions();
        var childrenAdditions = getChildrenAdditions();

        util.arrayPushAll(defaultNavigation, navigation);
        util.arrayPushAll(additions, navigation);

        if(pb.config.multisite) {
            util.arrayPushAll(multiSiteAdditions, navigation);
        }

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
                navigation[i].children = [];
            }
            util.arrayPushAll(children, nav.children);
        });

        return navigation;
    };

    /**
     * @private
     * @static
     * @method localizeNavigation
     * @param navigation
     * @param ls
     * @returns {*}
     */
    function localizeNavigation(navigation, ls) {
        navigation.forEach(function(nav) {
            nav.title = ls.get(nav.title);
            if(util.isArray(nav.children)) {
                nav.children = localizeNavigation(nav.children, ls);
            }
        });
        return navigation;
    };

    /**
     * @private
     * @static
     * @method isDuplicate
     * @param {String} id
     * @param {Array} navigation
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
    }

    function exists(id, site) {
        var isGlobal = pb.SiteService.isGlobal(site);
        return isDuplicate(id, buildNavigation(getSiteContext(site))) ||
          (!isGlobal && isDuplicate(id, buildNavigation(getSiteContext(GLOBAL_SITE))))
    }

    /**
     * @private
     * @static
     * @method isDefaultNode
     * @param {String} id
     * @return {Boolean}
     */
    function isDefaultNode(id) {
        return isDuplicate(id, getDefaultNavigation());
    };

    /**
     * Retrive the admin navigation hierarchy
     * @static
     * @method get
     * @param {object} session
     * @param {array} activeMenuItems Array of nav item names that are active
     * @param {Object} ls Localization service
     * @return {object} Admin navigation
     */
    AdminNavigation.get = function (session, activeMenuItems, ls) {
        var navigation = AdminNavigation.removeUnauthorized(
            session,
            buildNavigation(session),
            activeMenuItems
        );

        return localizeNavigation(navigation, ls);
    };

    /**
     * Adds a new child node to an existing top level node
     * @static
     * @method addChild
     * @param {String} parentId
     * @param {Object} node
     * @returns {Boolean}
     * @param site
     */
    AdminNavigation.addChildToSite = function (parentId, node, site) {
        if (exists(node.id, site)) {
            return false;
        }

        var additionsMap;
        if (!(site in AdminNavigation.childrenAdditions)) {
            additionsMap = AdminNavigation.childrenAdditions[site] = {}
        } else {
            additionsMap = AdminNavigation.childrenAdditions[site];
        }

        if (!additionsMap[parentId]) {
            additionsMap[parentId] = [];
        }

        additionsMap[parentId].push(node);
        return true;
    };

    AdminNavigation.addChild = function (parentId, node) {
        return AdminNavigation.addChildToSite(parentId, node, GLOBAL_SITE);
    };

    function getSiteContext(site) {
        return {adminSiteId: site};
    }

    /**
     * Adds a new top level node
     * @static
     * @method add
     * @param {Object} node
     * @returns {Boolean}
     * @param site
     */
    AdminNavigation.addToSite = function (node, site) {
        if (exists(node.id, site)) {
            return false;
        }

        if (!(site in AdminNavigation.additions)) {
            AdminNavigation.additions[site] = [];
        }
        AdminNavigation.additions[site].push(node);
        return true;
    };

    AdminNavigation.add = function (node) {
        return AdminNavigation.addToSite(node, GLOBAL_SITE);
    };

    AdminNavigation.remove = function (id) {
        return AdminNavigation.removeFromSite(id, GLOBAL_SITE);
    };

    /**
     * Remove a navigation node
     * @static
     * @method remove
     * @param id
     * @returns {boolean}
     * @param site
     */
    AdminNavigation.removeFromSite = function (id, site) {
        if (!isDuplicate(id, buildNavigation(getSiteContext(site)))) {
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

        AdminNavigation.additions[site] = removeNode(id, AdminNavigation.additions[site]);

        var childAdditionsMap = AdminNavigation.childrenAdditions[site];
        for (var parentId in  childAdditionsMap) {
            childAdditionsMap[parentId] = removeNode(id, childAdditionsMap[parentId]);
        }

        return true;
    };

    /**
     * @static
     * @method removeUnauthorized
     * @param {Object} session
     * @param {Array} adminNavigation
     * @param {Array} activeItems
     * @returns {Array}
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
    return AdminNavigation;
};
