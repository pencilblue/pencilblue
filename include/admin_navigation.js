/*
 Copyright (C) 2016  PencilBlue, LLC

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
'use strict';

//dependencies
var _ = require('lodash');
var ArrayUtils = require('../lib/utils/array_utils');
var Configuration = require('./config');
var log = require('./utils/logging').newInstance('AdminNavigation');
var SecurityService = require('./access_management');
const SiteUtils = require('../lib/utils/siteUtils');

/**
 * Provides function to construct the structure needed to display the navigation
 * in the Admin section of the application.
 * TODO [1.0] Remove in favor of global navigtion assignments
 * @module Services
 * @submodule Admin
 * @class AdminNavigation
 * @constructor
 */
class AdminNavigation {

    /**
     *
     * @readonly
     * @return {Array}
     */
    static get MULTISITE_NAV() {
        return Object.freeze({
                id: 'site_entity',
                title: 'admin.MANAGE_SITES',
                icon: 'sitemap',
                href: '/admin/sites',
                access: SecurityService.ACCESS_ADMINISTRATOR

            }
        );
    }

    /**
     *
     * @readonly
     * @return {object}
     */
    static get CONTENT_NAV() {
        return Object.freeze({
            id: 'content',
            title: 'generic.CONTENT',
            icon: 'quote-right',
            href: '#',
            access: SecurityService.ACCESS_WRITER,
            children: [
                {
                    id: 'navigation',
                    title: 'generic.NAVIGATION',
                    icon: 'th-large',
                    href: '/admin/content/navigation',
                    access: SecurityService.ACCESS_EDITOR
                },
                {
                    id: 'topics',
                    title: 'admin.TOPICS',
                    icon: 'tags',
                    href: '/admin/content/topics',
                    access: SecurityService.ACCESS_EDITOR
                },
                {
                    id: 'pages',
                    title: 'admin.PAGES',
                    icon: 'file-o',
                    href: '/admin/content/pages',
                    access: SecurityService.ACCESS_EDITOR
                },
                {
                    id: 'articles',
                    title: 'admin.ARTICLES',
                    icon: 'files-o',
                    href: '/admin/content/articles',
                    access: SecurityService.ACCESS_WRITER
                },
                {
                    id: 'media',
                    title: 'admin.MEDIA',
                    icon: 'camera',
                    href: '/admin/content/media',
                    access: SecurityService.ACCESS_WRITER
                },
                {
                    id: 'comments',
                    title: 'generic.COMMENTS',
                    icon: 'comments',
                    href: '/admin/content/comments',
                    access: SecurityService.ACCESS_EDITOR
                },
                {
                    id: 'custom_objects',
                    title: 'admin.CUSTOM_OBJECTS',
                    icon: 'cubes',
                    href: '/admin/content/objects/types',
                    access: SecurityService.ACCESS_EDITOR
                }
            ]
        });
    }

    /**
     *
     * @readonly
     * @returns {Object}
     */
    static get PLUGINS_NAV() {
        return Object.freeze({
            id: 'plugins',
            title: 'admin.PLUGINS',
            icon: 'puzzle-piece',
            href: '#',
            access: SecurityService.ACCESS_ADMINISTRATOR,
            children: [
                {
                    divider: true,
                    id: 'manage',
                    title: 'generic.MANAGE',
                    icon: 'upload',
                    href: '/admin/plugins'
                },
                {
                    id: 'themes',
                    title: 'admin.THEMES',
                    icon: 'magic',
                    href: '/admin/themes'
                }
            ]
        });
    }

    /**
     *
     * @readonly
     * @returns {Object}
     */
    static get USERS_NAV() {
        return Object.freeze({
            id: 'users',
            title: 'admin.USERS',
            icon: 'users',
            href: '#',
            access: SecurityService.ACCESS_EDITOR,
            children: [
                {
                    id: 'manage',
                    title: 'generic.MANAGE',
                    icon: 'users',
                    href: '/admin/users',
                    access: SecurityService.ACCESS_EDITOR
                },
                {
                    id: 'permissions',
                    title: 'generic.PERMISSIONS',
                    icon: 'lock',
                    href: '/admin/users/permissions',
                    access: SecurityService.ACCESS_ADMINISTRATOR
                }
            ]
        });
    }

    /**
     *
     * @readonly
     * @returns {Object}
     */
    static get VIEW_SITE_NAV() {
        return Object.freeze({
            id: 'view_site',
            title: 'admin.VIEW_SITE',
            icon: 'desktop',
            href: '/',
            access: SecurityService.ACCESS_WRITER
        });
    }

    /**
     *
     * @readonly
     * @returns {Object}
     */
    static get LOGOUT_NAV() {
        return Object.freeze({
            id: 'logout',
            title: 'generic.LOGOUT',
            icon: 'power-off',
            href: '/actions/logout',
            access: SecurityService.ACCESS_WRITER
        });
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
    static get (session, activeMenuItems, ls, site) {
        var navigation = AdminNavigation.removeUnauthorized(
            session,
            buildNavigation(site),
            activeMenuItems
        );

        return localizeNavigation(navigation, ls);
    }

    static addChild (parentId, node) {
        AdminNavigation.addChildToSite(parentId, node, SiteUtils.GLOBAL_SITE);
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
    static addChildToSite (parentId, node, site) {
        if (_.isNil(site)) {
            site = SiteUtils.GLOBAL_SITE;
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
    }

    /**
     * Adds a new top level node
     * @static
     * @method add
     * @param {Object} node
     * @param {String} [site='global']
     * @return {Boolean}
     */
    static add (node, site) {
        if (_.isNil(site)) {
            site = SiteUtils.GLOBAL_SITE;
        }
        if (exists(node.id, site)) {
            return false;
        }

        if (!(site in AdminNavigation.additions)) {
            AdminNavigation.additions[site] = [];
        }
        AdminNavigation.additions[site].push(node);
        return true;
    }

    /**
     * Adds a new top level node
     * @static
     * @method addToSite
     * @param {Object} node
     * @param {String} site
     * @return {Boolean}
     */
    static addToSite (node, site) {
        return AdminNavigation.add(node, site);
    }

    /**
     * Remove a navigation node
     * @static
     * @method remove
     * @param id
     * @param {String} [site='global']
     * @return {boolean}
     */
    static remove (id, site) {
        if (_.isNil(site)) {
            site = SiteUtils.GLOBAL_SITE;
        }
        if (!isDuplicate(id, buildNavigation(site))) {
            return false;
        }

        if (isDefaultNode(id)) {
            log.warn("Admin Navigation: Attempting to remove default Node %s", id);
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
        _.forEach(childAdditionsMap, function (value, key) {
            if (key === id) {
                delete childAdditionsMap[key];
            } else {
                childAdditionsMap[key] = removeNode(id, value);
            }
        });

        return true;
    }

    /**
     * Remove a navigation node
     * @static
     * @method removeFromSite
     * @param id
     * @param {String} site
     * @return {boolean}
     */
    static removeFromSite (id, site) {
        return AdminNavigation.remove(id, site);
    }

    /**
     * @static
     * @method removeUnauthorized
     * @param {Object} session
     * @param {Array} adminNavigation
     * @param {Array} activeItems
     * @return {Array}
     */
    static removeUnauthorized (session, adminNavigation, activeItems) {
        for (var i = 0; i < adminNavigation.length; i++) {
            if (typeof adminNavigation[i].access !== 'undefined') {

                if (!SecurityService.isAuthorized(session, {admin_level: adminNavigation[i].access})) {
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

                            if (!SecurityService.isAuthorized(session, {admin_level: adminNavigation[i].children[j].access})) {
                                adminNavigation[i].children.splice(j, 1);
                                j--;
                                continue;
                            }
                        }

                        for (var p = 0; p < activeItems.length; p++) {
                            if (activeItems[p] === adminNavigation[i].children[j].id) {
                                adminNavigation[i].children[j].active = 'active';
                                break;
                            }
                        }
                    }
                }
            }
        }

        return adminNavigation;
    }
}

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

function buildSettingsNavigation(site) {
    var settingsNav = {
        id: 'settings',
        title: 'admin.SETTINGS',
        icon: 'cogs',
        href: '#',
        access: SecurityService.ACCESS_ADMINISTRATOR,
        children: [
            {
                id: 'site_settings',
                title: 'admin.SITE_SETTINGS',
                icon: 'cog',
                href: '/admin/site_settings',
                access: SecurityService.ACCESS_ADMINISTRATOR
            },
            {
                id: 'content_settings',
                title: 'admin.CONTENT',
                icon: 'quote-right',
                href: '/admin/site_settings/content',
                access: SecurityService.ACCESS_ADMINISTRATOR
            },
            {
                id: 'email_settings',
                title: 'users.EMAIL',
                icon: 'envelope',
                href: '/admin/site_settings/email',
                access: SecurityService.ACCESS_ADMINISTRATOR
            }
        ]
    };

    if (SiteUtils.isGlobal(site)) {
        settingsNav.children.push({
            id: 'library_settings',
            title: 'site_settings.LIBRARIES',
            icon: 'book',
            href: '/admin/site_settings/libraries',
            access: SecurityService.ACCESS_ADMINISTRATOR
        });
    }
    return Object.freeze(settingsNav);
}

function getDefaultNavigation(site) {
    return _.clone([AdminNavigation.CONTENT_NAV, AdminNavigation.PLUGINS_NAV, AdminNavigation.USERS_NAV, buildSettingsNavigation(site), AdminNavigation.VIEW_SITE_NAV, AdminNavigation.LOGOUT_NAV]);
}

function getMultiSiteNavigation() {
    return _.clone([AdminNavigation.MULTISITE_NAV]);
}

function getGlobalScopeNavigation(site) {
    return _.clone([AdminNavigation.PLUGINS_NAV, AdminNavigation.USERS_NAV, buildSettingsNavigation(site), AdminNavigation.LOGOUT_NAV]);
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
    if (additions[site]) {
        return _.clone(additions[site]);
    }
    else if (additions[SiteUtils.GLOBAL_SITE]) {
        return _.clone(additions[SiteUtils.GLOBAL_SITE]);
    }
    return _.clone(additions);
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

    if (Configuration.active.multisite.enabled) {
        var multiSiteAdditions = getMultiSiteNavigation();
        ArrayUtils.pushAll(multiSiteAdditions, navigation);
    }

    if (Configuration.active.multisite.enabled && SiteUtils.isGlobal(site)) {
        // Don't include content or view site in the nav for multitenancy global scope.
        ArrayUtils.pushAll(getGlobalScopeNavigation(site), navigation);
    }
    else {
        var defaultNavigation = getDefaultNavigation(site);
        ArrayUtils.pushAll(defaultNavigation, navigation);
    }

    ArrayUtils.pushAll(additions, navigation);

    //retrieve the nav items to iterate over
    var ids = Object.keys(childrenAdditions);
    if (ids.length === 0) {
        return navigation;
    }

    //convert to hash to create quick lookup
    var lookup = ArrayUtils.toObject(navigation, 'id');

    //add additions
    Object.keys(childrenAdditions).forEach(function(id) {
        var children = childrenAdditions[id];

        //find the nav that the children should be added to
        var nav = lookup[id];
        if (!nav) {
            return;
        }


        if (!Array.isArray(nav.children)) {
            nav.children = [];
        }
        ArrayUtils.pushAll(children, nav.children);
    });

    return navigation;
}

/**
 * @private
 * @static
 * @method localizeNavigation
 * @param {Array} navigation
 * @param {Localization} ls
 * @return {Array}
 */
function localizeNavigation(navigation, ls) {
    navigation.forEach(function(nav) {
        nav.title = ls.g(nav.title);
        if(Array.isArray(nav.children)) {
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
    var isGlobal = SiteUtils.isGlobal(site);
    var nav = buildNavigation(site);
    return isDuplicate(id, nav) ||
        (!isGlobal && isDuplicate(id, buildNavigation(SiteUtils.GLOBAL_SITE)));
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

//exports
module.exports = AdminNavigation;
