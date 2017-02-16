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
const _ = require('lodash');
const ArrayUtils = require('../../../lib/utils/array_utils');
const async   = require('async');
const DAO = require('../../dao/dao');
const Localization = require('../../localization');
const log = require('../../utils/logging').newInstance('SectionService');
const SecurityService = require('../../access_management');
const SettingServiceFactory = require('../../system/settings');
const SiteQueryService = require('./site_query_service');
const SiteService = require('./site_service');
const SiteUtils = require('../../../lib/utils/siteUtils');
const UrlService = require('./url_service');
const UrlUtils = require('../../../lib/utils/urlUtils');
const UserService = require('./user_service');
const ValidationService = require('../../validation/validation_service');

    /**
     * Service for managing the site's navigation
     * @class SectionService
     * @constructor
     * @param {object} options
     * @param {String} options.site uid
     * @param {Boolean} options.onlyThisSite should section service only return value set specifically by site rather than defaulting to global
     */
    class SectionService {
        constructor(options) {
            this.site = SiteService.getCurrentSite(options.site) || SiteUtils.GLOBAL_SITE;
            this.onlyThisSite = options.onlyThisSite || false;
            this.settings = SettingServiceFactory.getServiceBySite(this.site, this.onlyThisSite);
            this.siteQueryService = new SiteQueryService({site: this.site, onlyThisSite: this.onlyThisSite});
        }

        /**
         *
         * @private
         * @static
         * @readonly
         * @property VALID_TYPES
         * @type {Object}
         */
        static get VALID_TYPES() {
            return {
                container: true,
                section: true,
                article: true,
                page: true,
                link: true
            }
        }

        /**
         *
         * @static
         * @method getPillNavOptions
         * @param {String} activePill
         * @return {Array}
         */
        static getPillNavOptions  (/*activePill*/) {
            return [
                {
                    name: 'new_nav_item',
                    title: '',
                    icon: 'plus',
                    href: '/admin/content/navigation/new'
                }
            ];
        }

        /**
         *
         * @method removeFromSectionMap
         * @param {Object} section
         * @param {Array} [sectionMap]
         * @param {Function} cb
         */
        removeFromSectionMap  (section, sectionMap, cb) {
            var self = this;

            if (!cb) {
                cb = sectionMap;
                sectionMap = null;
            }

            //ensure we have an ID
            if (_.isObject(section)) {
                section = section[DAO.getIdField()].toString();
            }

            //provide a function to abstract retrieval of map
            var sectionMapWasNull = sectionMap ? false : true;
            var getSectionMap = function (sectionMap, callback) {
                if (Array.isArray(sectionMap)) {
                    callback(null, sectionMap);
                }
                else {
                    self.settings.get('section_map', callback);
                }
            };

            //retrieve map
            getSectionMap(sectionMap, function (err, sectionMap) {
                if (_.isError(err)) {
                    cb(err, false);
                    return;
                }
                else if (sectionMap === null) {
                    cb(new Error("The section map is null and therefore cannot have any sections removed", false));
                    return;
                }

                //update map
                var orphans = self._removeFromSectionMap(section, sectionMap);

                //when the section map was not provided persist it back
                if (sectionMapWasNull) {
                    self.settings.set('section_map', sectionMap, function (err/*, result*/) {
                        cb(err, orphans);
                    });
                }
                else {
                    cb(null, orphans);
                }
            });
        }

        /**
         *
         * @private
         * @method _removeFromSectionMap
         * @param {String} sid
         * @param {Array} sectionMap
         */
        _removeFromSectionMap  (sid, sectionMap) {

            //inspect the top level
            var orphans = [];
            for (var i = sectionMap.length - 1; i >= 0; i--) {

                var item = sectionMap[i];
                if (item.uid === sid) {
                    sectionMap.splice(i, 1);
                    ArrayUtils.pushAll(item.children, orphans);
                }
                else if (Array.isArray(item.children)) {

                    for (var j = item.children.length - 1; j >= 0; j--) {

                        var child = item.children[j];
                        if (child.uid === sid) {
                            item.children.splice(j, 1);
                        }
                    }
                }
            }
            return orphans;
        }

        /**
         *
         * @private
         * @method getSectionMapIndex
         * @param {String} sid
         * @param {Array} sectionMap
         * @return {Object}
         */
        getSectionMapIndex  (sid, sectionMap) {

            //inspect the top level
            var result = {
                index: -1,
                childIndex: -1
            };
            for (var i = sectionMap.length - 1; i >= 0; i--) {

                var item = sectionMap[i];
                if (item.uid === sid) {
                    result.index = i;
                }
                else if (Array.isArray(item.children)) {

                    for (var j = item.children.length - 1; j >= 0; j--) {

                        var child = item.children[j];
                        if (child.uid === sid) {
                            result.childIndex = j;
                        }
                    }
                }
            }
            return result;
        }

        /**
         *
         * @method updateNavMap
         * @param {Object} section
         * @param {Function} cb
         */
        updateNavMap  (section, cb) {
            var self = this;

            //do validation
            if (!_.isObject(section) || !section[DAO.getIdField()]) {
                return cb(new Error("A valid section object must be provided", false));
            }

            //retrieve the section map
            var sid = section[DAO.getIdField()].toString();
            self.settings.get('section_map', function (err, sectionMap) {
                if (_.isError(err)) {
                    return cb(err, false);
                }

                //create it if not already done
                var mapWasNull = sectionMap === null;
                if (mapWasNull) {
                    sectionMap = [];
                }

                //check if the section already exist in sectionMap
                var sectionIndex = self.getSectionMapIndex(sid, sectionMap);
                //remove the section from the map
                var orphans = self._removeFromSectionMap(sid, sectionMap);

                //make a top level item if there is no parent or the map was originally
                //empty (means its impossible for there to be a parent)
                var navItem = {
                    uid: sid,
                    children: orphans
                };
                if (mapWasNull || !section.parent) {

                    //we are attaching the items back to a parent.  There are no
                    //orphans to return in the callback.
                    orphans = [];

                    if (sectionIndex.index > -1) {
                        sectionMap.splice(sectionIndex.index, 0, navItem);
                    }
                    else {
                        sectionMap.push(navItem);
                    }
                }
                else {//set as child of parent in map

                    //we only support two levels so ensure we drop any children
                    navItem.children = undefined;

                    for (var i = 0; i < sectionMap.length; i++) {
                        if (sectionMap[i].uid === section.parent) {
                            if (sectionIndex.childIndex > -1) {
                                sectionMap[i].children.splice(sectionIndex.childIndex, 0, navItem);
                            }
                            else {
                                sectionMap[i].children.push(navItem);
                            }
                            break;
                        }
                    }
                }

                self.settings.set('section_map', sectionMap, function (err, settingSaveResult) {
                    if (_.isError(err)) {
                        return cb(err);
                    }
                    else if (!settingSaveResult) {
                        return cb(new Error('Failed to persist cached navigation map'));
                    }
                    cb(null, orphans);
                });
            });
        }

        /**
         *
         * @method deleteChildren
         * @param {String} parentId
         * @param {Function} cb
         */
        deleteChildren  (parentId, cb) {

            var where = {
                parent: '' + parentId
            }
            var dao = new DAO();
            dao.delete(where, 'section', cb);
        }

        /**
         *
         * @method getFormattedSections
         * @param {Localization} localizationService
         * @param {String} [currUrl]
         * @param {Function} cb
         */
        getFormattedSections  (localizationService, currUrl, cb) {
            var self = this;
            if (_.isFunction(currUrl)) {
                cb = currUrl;
                currUrl = null;
            }

            self.settings.get('section_map', function (err, sectionMap) {
                if (_.isError(err) || sectionMap === null) {
                    cb(err, []);
                    return;
                }

                //retrieve sections
                self.siteQueryService.q('section', function (err, sections) {
                    if (_.isError(err)) {
                        return cb(err, []);
                    }

                    var formattedSections = [];
                    for (var i = 0; i < sectionMap.length; i++) {
                        var section = SectionService.getSectionData(sectionMap[i].uid, sections, currUrl);
                        if (_.isNil(section)) {
                            log.error('SectionService: The navigation map is out of sync.  Root [%s] could not be found for site [%s].', sectionMap[i].uid, self.site);
                            continue;
                        }

                        if (sectionMap[i].children.length === 0) {
                            formattedSections.push(section);
                        }
                        else {
                            if (section) {
                                section.dropdown = 'dropdown';

                                section.children = [];
                                for (var j = 0; j < sectionMap[i].children.length; j++) {
                                    var child = SectionService.getSectionData(sectionMap[i].children[j].uid, sections, currUrl);
                                    if (_.isNil(child)) {
                                        log.error('SectionService: The navigation map is out of sync.  Child [%s] could not be found for site [%s].', sectionMap[i].children[j].uid, self.site);
                                        continue;
                                    }

                                    //when the child is active so is the parent.
                                    if (child.active) {
                                        section.active = true;
                                    }
                                    section.children.push(child);
                                }

                                formattedSections.push(section);
                            }
                        }
                    }
                    cb(null, formattedSections);
                });
            });
        }

        /**
         *
         * @method getParentSelectList
         * @param {String|ObjectID} currItem
         * @param {Function} cb
         */
        getParentSelectList  (currItem, cb) {
            cb = cb || currItem;

            var where = {
                type: 'container'
            };
            if (currItem && !_.isFunction(currItem)) {
                where[DAO.getIdField()] = DAO.getNotIdField(currItem);
            }

            var opts = {
                select: {
                    _id: 1,
                    name: 1
                },
                where: where,
                order: ['name', DAO.ASC]
            };
            this.siteQueryService.q('section', opts, cb);
        }

        /**
         *
         * @static
         * @method trimForType
         * @param {Object} navItem
         */
        static trimForType  (navItem) {
            if (navItem.type === 'container') {
                navItem.parent = null;
                navItem.url = null;
                navItem.editor = null;
                navItem.item = null;
                navItem.link = null;
                navItem.new_tab = null;
            }
            else if (navItem.type === 'section') {
                navItem.item = null;
                navItem.link = null;
                navItem.new_tab = null;
            }
            else if (navItem.type === 'article' || navItem.type === 'page') {
                navItem.link = null;
                navItem.url = null;
                navItem.editor = null;
                navItem.new_tab = null;
            }
            else if (navItem.type === 'link') {
                navItem.editor = null;
                navItem.url = null;
                navItem.item = null;
            }
        }

        /**
         *
         * @method validate
         * @param {Object} navItem
         * @param {Function} cb
         */
        validate  (navItem, cb) {
            var self = this;
            var errors = [];
            if (!_.isObject(navItem)) {
                errors.push({field: '', message: 'A valid navigation item must be provided'});
                cb(null, errors);
                return;
            }

            //verify type
            if (!SectionService.isValidType(navItem.type)) {
                errors.push({field: 'type', message: 'An invalid type [' + navItem.type + '] was provided'});
                cb(null, errors);
                return;
            }

            //name
            this.validateNavItemName(navItem, function (err, validationError) {
                if (_.isError(err)) {
                    cb(err, errors);
                    return;
                }

                if (validationError) {
                    errors.push(validationError);
                }

                //description
                if (!ValidationService.isNonEmptyStr(navItem.name, true)) {
                    errors.push({field: 'name', message: 'An invalid name [' + navItem.name + '] was provided'});
                }

                //compile all errors and call back
                var onDone = function (err, validationErrors) {
                    ArrayUtils.pushAll(validationErrors, errors);
                    cb(err, errors);
                };

                //validate for each type of nav item
                switch (navItem.type) {
                    case 'container':
                        onDone(null, []);
                        break;
                    case 'section':
                        self.validateSectionNavItem(navItem, onDone);
                        break;
                    case 'article':
                    case 'page':
                        self.validateContentNavItem(navItem, onDone);
                        break;
                    case 'link':
                        self.validateLinkNavItem(navItem, onDone);
                        break;
                    default:
                        throw new Error("An invalid nav item type made it through!");
                }
            });
        }

        /**
         *
         * @method validateLinkNavItem
         * @param {Object} navItem
         * @param {Function} cb
         */
        validateLinkNavItem  (navItem, cb) {
            var errors = [];
            if (!ValidationService.isUrl(navItem.link, true) && navItem.link.charAt(0) !== '/') {
                errors.push({field: 'link', message: 'A valid link is required'});
            }
            process.nextTick(function () {
                cb(null, errors);
            });
        }

        /**
         *
         * @method validateNavItemName
         * @param {Object} navItem
         * @param {Function} cb
         */
        validateNavItemName  (navItem, cb) {
            if (!ValidationService.isNonEmptyStr(navItem.name, true) || navItem.name === 'admin') {
                cb(null, {field: 'name', message: 'An invalid name [' + navItem.name + '] was provided'});
                return;
            }

            var where = {
                name: navItem.name
            };
            this.siteQueryService.unique('section', where, navItem[DAO.getIdField()], function (err, unique) {
                var error = null;
                if (!unique) {
                    error = {field: 'name', message: 'The provided name is not unique'};
                }
                cb(err, error);
            });
        }

        /**
         *
         * @method validateContentNavItem
         * @param {Object} navItem
         * @param {Function} cb
         */
        validateContentNavItem  (navItem, cb) {
            var self = this;
            var errors = [];
            var tasks = [

                //parent
                function (callback) {
                    self.validateNavItemParent(navItem.parent, function (err, validationError) {
                        if (validationError) {
                            errors.push(validationError);
                        }
                        callback(err, null);
                    });
                },

                //content
                function (callback) {
                    self.validateNavItemContent(navItem.type, navItem.item, function (err, validationError) {
                        if (validationError) {
                            errors.push(validationError);
                        }
                        callback(err, null);
                    });
                }
            ];
            async.series(tasks, function (err/*, results*/) {
                cb(err, errors);
            });
        }

        /**
         *
         * @method validateSectionNavItem
         * @param {Object} navItem
         * @param {Function} cb
         */
        validateSectionNavItem  (navItem, cb) {
            var self = this;
            var errors = [];
            var tasks = [

                //url
                function (callback) {

                    var params = {
                        type: 'section',
                        id: navItem[DAO.getIdField()],
                        url: navItem.url,
                        site: self.site
                    };
                    var urlService = new UrlService();
                    urlService.existsForType(params, function (err, exists) {
                        if (exists) {
                            errors.push({field: 'url', message: 'The url key [' + navItem.url + '] already exists'});
                        }
                        callback(err, null);
                    });
                },

                //parent
                function (callback) {
                    self.validateNavItemParent(navItem.parent, function (err, validationError) {
                        if (validationError) {
                            errors.push(validationError);
                        }
                        callback(err, null);
                    });
                },

                //editor
                function (callback) {
                    self.validateNavItemEditor(navItem.editor, function (err, validationError) {
                        if (validationError) {
                            errors.push(validationError);
                        }
                        callback(err, null);
                    });
                }
            ];
            async.series(tasks, function (err/*, results*/) {
                cb(err, errors);
            });
        }

        /**
         *
         * @method validateNavItemParent
         * @param {String} parent
         * @param {Function} cb
         */
        validateNavItemParent  (parent, cb) {

            var error = null;
            if (!ValidationService.isNonEmptyStr(parent, false)) {
                error = {field: 'parent', message: 'The parent must be a valid nav item container ID'};
                cb(null, error);
            }
            else if (parent) {

                //ensure parent exists
                var where = DAO.getIdWhere(parent);
                where.type = 'container';
                var dao = new DAO();
                dao.count('section', where, function (err, count) {
                    if (count !== 1) {
                        error = {field: 'parent', message: 'The parent is not valid'};
                    }
                    cb(err, error);
                });
            }
            else {
                cb(null, null);
            }
        }

        /**
         *
         * @method validateNavItemContent
         * @param {String} type
         * @param {String} content
         * @param {Function} cb
         */
        validateNavItemContent  (type, content, cb) {

            var error = null;
            if (!ValidationService.isNonEmptyStr(content, true)) {
                error = {field: 'item', message: 'The content must be a valid ID'};
                cb(null, error);
                return;
            }

            //ensure content exists
            var where = DAO.getIdWhere(content);
            var dao = new DAO();
            dao.count(type, where, function (err, count) {
                if (count !== 1) {
                    error = {field: 'item', message: 'The content is not valid'};
                }
                cb(err, error);
            });
        }

        /**
         *
         * @method validateNavItemEditor
         * @param {String} editor
         * @param {Function} cb
         */
        validateNavItemEditor  (editor, cb) {

            var error = null;
            if (!ValidationService.isNonEmptyStr(editor, true)) {
                error = {field: 'editor', message: 'The editor must be a valid user ID'};
                cb(null, error);
                return;
            }

            var service = new UserService();
            service.hasAccessLevel(editor, SecurityService.ACCESS_EDITOR, function (err, hasAccess) {
                if (!hasAccess) {
                    error = {field: 'editor', message: 'The editor is not valid'};
                }
                cb(err, error);
            });
        }

        /**
         *
         * @method save
         * @param {Object} navItem
         * @param {Object} [options]
         * @param {Function} cb
         */
        save  (navItem, options, cb) {
            if (_.isFunction(options)) {
                cb = options;
                options = {};
            }

            //validate
            var self = this;
            self.validate(navItem, function (err, validationErrors) {
                if (_.isError(err)) {
                    return cb(err);
                }
                else if (validationErrors.length > 0) {
                    return cb(null, validationErrors);
                }

                //persist the changes
                self.siteQueryService.save(navItem, function (err/*, data*/) {
                    if (_.isError(err)) {
                        return cb(err);
                    }

                    //update the navigation map
                    self.updateNavMap(navItem, function (err, orphans) {
                        if (_.isError(err)) {
                            return cb(err);
                        }
                        else if (orphans.length === 0) {
                            //we kept the children so there is nothing to do
                            return cb(null, true);
                        }

                        //ok, now we can delete the orhphans if they exist
                        self.deleteChildren(navItem[DAO.getIdField()], cb);
                    });
                });
            });
        }

        /**
         *
         * @static
         * @method getSectionData
         * @param {String} uid
         * @param {Object} navItems
         * @param {String} currUrl
         */
        static getSectionData  (uid, navItems, currUrl) {
            for (var i = 0; i < navItems.length; i++) {

                var navItem = navItems[i];
                if (navItem[DAO.getIdField()].toString() === uid) {
                    SectionService.formatUrl(navItem);

                    //check for URL comparison
                    if (currUrl === navItem.url) {
                        navItem.active = true;
                    }
                    return navItem;
                }
            }
            return null;
        }

        /**
         *
         * @static
         * @method formatUrl
         * @param {Object} navItem
         */
        static formatUrl  (navItem) {
            if (_.isString(navItem.link)) {
                navItem.url = navItem.link;
            }
            else if (navItem.url) {
                navItem.url = UrlUtils.join('/section', navItem.url);
            }
            else if (navItem.type === 'article') {
                navItem.url = UrlUtils.join('/article', navItem.item);
            }
            else if (navItem.type === 'page') {
                navItem.url = UrlUtils.join('/page', navItem.item);
            }
            else {
                navItem.url = '#' + (navItem.name || '');
            }
        }

        /**
         * TODO [1.0] remove defaulting localization service & fix double quoted strings
         * @static
         * @method
         * @param {Localization} ls
         * @return {Array}
         */
        static getTypes  (ls) {
            if (!ls) {
                ls = new Localization();
            }

            return [
                {
                    value: "container",
                    label: ls.g('generic.CONTAINER')
                },
                {
                    value: "section",
                    label: ls.g('generic.SECTION')
                },
                {
                    value: "article",
                    label: ls.g('generic.ARTICLE')
                },
                {
                    value: "page",
                    label: ls.g('generic.PAGE')
                },
                {
                    value: "link",
                    label: ls.g('generic.LINK')
                }
            ];
        }

        /**
         * @static
         * @method isValidType
         * @param {String|Object} type
         * @return {Boolean}
         */
        static isValidType  (type) {
            if (_.isObject(type)) {
                type = type.type;
            }

            return SectionService.VALID_TYPES[type] === true;
        }
    }

    //exports
    module.exports = SectionService;
