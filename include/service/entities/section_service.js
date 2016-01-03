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
var process = require('process');
var async   = require('async');
var util    = require('../../util.js');

module.exports = function SectionServiceModule(pb) {

    /**
     * Service for managing the site's navigation
     * @class SectionService
     * @constructor
     * @param {String} site uid
     * @param {Boolean} onlyThisSite should section service only return value set specifically by site rather than defaulting to global
     */
    function SectionService(options) {
        this.site = pb.SiteService.getCurrentSite(options.site) || pb.SiteService.GLOBAL_SITE;
        this.onlyThisSite = options.onlyThisSite || false;
        this.settings = pb.SettingServiceFactory.getServiceBySite(this.site, this.onlyThisSite);
        this.siteQueryService = new pb.SiteQueryService({site: this.site, onlyThisSite: this.onlyThisSite});
    }

    /**
     *
     * @private
     * @static
     * @readonly
     * @property VALID_TYPES
     * @type {Object}
     */
    var VALID_TYPES = {
        container: true,
        section: true,
        article: true,
        page: true,
        link: true,
    };

    /**
     *
     * @static
     * @method getPillNavOptions
     * @param {String} activePill
     * @return {Array}
     */
    SectionService.getPillNavOptions = function(activePill) {
        return [
            {
                name: 'new_nav_item',
                title: '',
                icon: 'plus',
                href: '/admin/content/navigation/new'
            }
        ];
    };

    /**
     *
     * @method removeFromSectionMap
     * @param {Object} section
     * @param {Array} [sectionMap]
     * @param {Function} cb
     */
    SectionService.prototype.removeFromSectionMap = function(section, sectionMap, cb) {
        var self = this;

        if (!cb) {
            cb         = sectionMap;
            sectionMap = null;
        }

        //ensure we have an ID
        if (util.isObject(section)) {
            section = section[pb.DAO.getIdField()].toString();
        }

        //provide a function to abstract retrieval of map
        var sectionMapWasNull = sectionMap ? false : true;
        var getSectionMap = function (sectionMap, callback) {
            if (util.isArray(sectionMap)) {
                callback(null, sectionMap);
            }
            else {
                self.settings.get('section_map', callback);
            }
        };

        //retrieve map
        getSectionMap(sectionMap, function(err, sectionMap) {
            if (util.isError(err)) {
                cb(err, false);
                return;
            }
            else if (sectionMap == null) {
                cb(new Error("The section map is null and therefore cannot have any sections removed", false));
                return;
            }

            //update map
            var orphans = self._removeFromSectionMap(section, sectionMap);

            //when the section map was not provided persist it back
            if (sectionMapWasNull) {
                self.settings.set('section_map', sectionMap, function(err, result) {
                    cb(err, orphans);
                });
            }
            else {
                cb(null, orphans);
            }
        });
    };

    /**
     *
     * @private
     * @method _removeFromSectionMap
     * @param {String} sid
     * @param {Array} sectionMap
     */
    SectionService.prototype._removeFromSectionMap = function(sid, sectionMap) {

        //inspect the top level
        var orphans = [];
        for (var i = sectionMap.length - 1; i >= 0; i--) {

            var item = sectionMap[i];
            if (item.uid === sid) {
                sectionMap.splice(i, 1);
                util.arrayPushAll(item.children, orphans);
            }
            else if (util.isArray(item.children)) {

                for (var j = item.children.length - 1; j >= 0; j--) {

                    var child = item.children[j];
                    if (child.uid === sid) {
                        item.children.splice(j, 1);
                    }
                }
            }
        }
        return orphans;
    };

        /**
     *
     * @private
     * @method getSectionMapIndex
     * @param {String} sid
     * @param {Array} sectionMap
     * @return {Object}
     */
    SectionService.prototype.getSectionMapIndex = function(sid, sectionMap) {

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
            else if (util.isArray(item.children)) {

                for (var j = item.children.length - 1; j >= 0; j--) {

                    var child = item.children[j];
                    if (child.uid === sid) {
                        result.childIndex = j;
                    }
                }
            }
        }
        return result;
    };

    /**
     *
     * @method updateNavMap
     * @param {Object} section
     * @param {Function} cb
     */
    SectionService.prototype.updateNavMap = function(section, cb) {
        var self = this;

        //do validation
        if (!util.isObject(section) || !section[pb.DAO.getIdField()]) {
            return cb(new Error("A valid section object must be provided", false));
        }

        //retrieve the section map
        var sid = section[pb.DAO.getIdField()].toString();
        self.settings.get('section_map', function(err, sectionMap) {
            if (util.isError(err)) {
                return cb(err, false);
            }

            //create it if not already done
            var mapWasNull = sectionMap == null;
            if(mapWasNull) {
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
                    if (sectionMap[i].uid == section.parent) {
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

            self.settings.set('section_map', sectionMap, function(err, settingSaveResult){
                if (util.isError(err)){
                    return cb(err);
                }
                else if (!settingSaveResult) {
                    return cb(new Error('Failed to persist cached navigation map'));
                }
                cb(null, orphans);
            });
        });
    };

    /**
     *
     * @method deleteChildren
     * @param {String} parentId
     * @param {Function} cb
     */
    SectionService.prototype.deleteChildren = function(parentId, cb) {

        var where = {
            parent: ''+parentId
        };
        var dao = new pb.DAO();
        dao.delete(where, 'section', cb);
    };

    /**
     *
     * @method getFormattedSections
     * @param {Localization} localizationService
     * @param {String} [currUrl]
     * @param {Function} cb
     */
    SectionService.prototype.getFormattedSections = function(localizationService, currUrl, cb) {
        var self = this;
        if (util.isFunction(currUrl)) {
            cb      = currUrl;
            currUrl = null;
        }

        self.settings.get('section_map', function(err, sectionMap) {
            if (util.isError(err) || sectionMap == null) {
                cb(err, []);
                return;
            }

            //retrieve sections
            self.siteQueryService.q('section', function(err, sections) {
                if (util.isError(err)) {
                    return cb(err, []);
                }

                var formattedSections = [];
                for(var i = 0; i < sectionMap.length; i++) {
                    var section    = SectionService.getSectionData(sectionMap[i].uid, sections, currUrl);
                    if (util.isNullOrUndefined(section)) {
                        pb.log.error('SectionService: The navigation map is out of sync.  Root [%s] could not be found for site [%s].', sectionMap[i].uid, self.site);
                        continue;
                    }

                    if(sectionMap[i].children.length === 0) {
                        formattedSections.push(section);
                    }
                    else {
                        if(section) {
                            section.dropdown = 'dropdown';

                            section.children = [];
                            for(var j = 0; j < sectionMap[i].children.length; j++) {
                                var child = SectionService.getSectionData(sectionMap[i].children[j].uid, sections, currUrl);
                                if (util.isNullOrUndefined(child)) {
                                    pb.log.error('SectionService: The navigation map is out of sync.  Child [%s] could not be found for site [%s].', sectionMap[i].children[j].uid, self.site);
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
    };

    /**
     *
     * @method getParentSelectList
     * @param {String|ObjectID} currItem
     * @param {Function} cb
     */
    SectionService.prototype.getParentSelectList = function(currItem, cb) {
        cb = cb || currItem;

        var where = {
            type: 'container'
        };
        if (currItem && !util.isFunction(currItem)) {
            where[pb.DAO.getIdField()] = pb.DAO.getNotIdField(currItem);
        }

        var opts = {
            select: {
                _id: 1,
                name: 1
            },
            where: where,
            order: {'name': pb.DAO.ASC}
        };
        this.siteQueryService.q('section', opts, cb);
    };

    /**
     *
     * @static
     * @method trimForType
     * @param {Object} navItem
     */
    SectionService.trimForType = function(navItem) {
        if (navItem.type === 'container') {
            navItem.parent = null;
            navItem.url    = null;
            navItem.editor = null;
            navItem.item   = null;
            navItem.link   = null;
            navItem.new_tab = null;
        }
        else if (navItem.type === 'section') {
            navItem.item = null;
            navItem.link = null;
            navItem.new_tab = null;
        }
        else if (navItem.type === 'article' || navItem.type === 'page') {
            navItem.link   = null;
            navItem.url    = null;
            navItem.editor = null;
            navItem.new_tab = null;
        }
        else if (navItem.type === 'link') {
            navItem.editor = null;
            navItem.url    = null;
            navItem.item   = null;
        }
    };

    /**
     *
     * @method validate
     * @param {Object} navItem
     * @param {Function} cb
     */
    SectionService.prototype.validate = function(navItem, cb) {
        var self   = this;
        var errors = [];
        if (!util.isObject(navItem)) {
            errors.push({field: '', message: 'A valid navigation item must be provided'});
            cb(null, errors);
            return;
        }

        //verify type
        if (!SectionService.isValidType(navItem.type)) {
            errors.push({field: 'type', message: 'An invalid type ['+navItem.type+'] was provided'});
            cb(null, errors);
            return;
        }

        //name
        this.validateNavItemName(navItem, function(err, validationError) {
            if (util.isError(err)) {
                cb(err, errors);
                return;
            }

            if (validationError) {
                errors.push(validationError);
            }

            //description
            if (!pb.validation.validateNonEmptyStr(navItem.name, true)) {
                errors.push({field: 'name', message: 'An invalid name ['+navItem.name+'] was provided'});
            }

            //compile all errors and call back
            var onDone = function(err, validationErrors) {
                util.arrayPushAll(validationErrors, errors);
                cb(err, errors);
            };

            //validate for each type of nav item
            switch(navItem.type) {
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
    };

    /**
     *
     * @method validateLinkNavItem
     * @param {Object} navItem
     * @param {Function} cb
     */
    SectionService.prototype.validateLinkNavItem = function(navItem, cb) {
        var errors = [];
        if (!pb.validation.validateUrl(navItem.link, true) && navItem.link.charAt(0) !== '/') {
            errors.push({field: 'link', message: 'A valid link is required'});
        }
        process.nextTick(function() {
            cb(null, errors);
        });
    };

    /**
     *
     * @method validateNavItemName
     * @param {Object} navItem
     * @param {Function} cb
     */
    SectionService.prototype.validateNavItemName = function(navItem, cb) {
        if (!pb.validation.validateNonEmptyStr(navItem.name, true) || navItem.name === 'admin') {
            cb(null, {field: 'name', message: 'An invalid name ['+navItem.name+'] was provided'});
            return;
        }

        var where = {
            name: navItem.name
        };
        this.siteQueryService.unique('section', where, navItem[pb.DAO.getIdField()], function(err, unique) {
            var error = null;
            if (!unique) {
                error = {field: 'name', message: 'The provided name is not unique'};
            }
            cb(err, error);
        });
    };

    /**
     *
     * @method validateContentNavItem
     * @param {Object} navItem
     * @param {Function} cb
     */
    SectionService.prototype.validateContentNavItem = function(navItem, cb) {
        var self   = this;
        var errors = [];
        var tasks  = [

            //parent
            function(callback) {
                self.validateNavItemParent(navItem.parent, function(err, validationError) {
                    if (validationError) {
                        errors.push(validationError);
                    }
                    callback(err, null);
                });
            },

            //content
            function(callback) {
                self.validateNavItemContent(navItem.type, navItem.item, function(err, validationError) {
                    if (validationError) {
                        errors.push(validationError);
                    }
                    callback(err, null);
                });
            }
        ];
        async.series(tasks, function(err, results) {
            cb(err, errors);
        });
    };

    /**
     *
     * @method validateSectionNavItem
     * @param {Object} navItem
     * @param {Function} cb
     */
    SectionService.prototype.validateSectionNavItem = function(navItem, cb) {
        var self   = this;
        var errors = [];
        var tasks  = [

            //url
            function(callback) {

                var params = {
                    type: 'section',
                    id: navItem[pb.DAO.getIdField()],
                    url: navItem.url,
                    site: self.site
                };
                var urlService = new pb.UrlService();
                urlService.existsForType(params, function(err, exists) {
                    if (exists) {
                        errors.push({field: 'url', message: 'The url key ['+navItem.url+'] already exists'});
                    }
                    callback(err, null);
                });
            },

            //parent
            function(callback) {
                self.validateNavItemParent(navItem.parent, function(err, validationError) {
                    if (validationError) {
                        errors.push(validationError);
                    }
                    callback(err, null);
                });
            },

            //editor
            function(callback) {
                self.validateNavItemEditor(navItem.editor, function(err, validationError) {
                    if (validationError) {
                        errors.push(validationError);
                    }
                    callback(err, null);
                });
            }
        ];
        async.series(tasks, function(err, results) {
            cb(err, errors);
        });
    };

    /**
     *
     * @method validateNavItemParent
     * @param {String} parent
     * @param {Function} cb
     */
    SectionService.prototype.validateNavItemParent = function(parent, cb) {

        var error = null;
        if (!pb.validation.validateNonEmptyStr(parent, false)) {
            error = {field: 'parent', message: 'The parent must be a valid nav item container ID'};
            cb(null, error);
        }
        else if (parent) {

            //ensure parent exists
            var where = pb.DAO.getIdWhere(parent);
            where.type = 'container';
            var dao = new pb.DAO();
            dao.count('section', where, function(err, count) {
                if (count !== 1) {
                    error = {field: 'parent', message: 'The parent is not valid'};
                }
                cb(err, error);
            });
        }
        else {
            cb(null, null);
        }
    };

    /**
     *
     * @method validateNavItemContent
     * @param {String} type
     * @param {String} content
     * @param {Function} cb
     */
    SectionService.prototype.validateNavItemContent = function(type, content, cb) {

        var error = null;
        if (!pb.validation.validateNonEmptyStr(content, true)) {
            error = {field: 'item', message: 'The content must be a valid ID'};
            cb(null, error);
            return;
        }

        //ensure content exists
        var where = pb.DAO.getIdWhere(content);
        var dao   = new pb.DAO();
        dao.count(type, where, function(err, count) {
            if (count !== 1) {
                error = {field: 'item', message: 'The content is not valid'};
            }
            cb(err, error);
        });
    };

    /**
     *
     * @method validateNavItemEditor
     * @param {String} editor
     * @param {Function} cb
     */
    SectionService.prototype.validateNavItemEditor = function(editor, cb) {

        var error = null;
        if (!pb.validation.validateNonEmptyStr(editor, true)) {
            error = {field: 'editor', message: 'The editor must be a valid user ID'};
            cb(null, error);
            return;
        }

        var service = new pb.UserService();
        service.hasAccessLevel(editor, pb.SecurityService.ACCESS_EDITOR, function(err, hasAccess) {
            if (!hasAccess) {
                error = {field: 'editor', message: 'The editor is not valid'};
            }
            cb(err, error);
        });
    };

    /**
     *
     * @method save
     * @param {Object} navItem
     * @param {Object} [options]
     * @param {Function} cb
     */
    SectionService.prototype.save = function(navItem, options, cb) {
        if (util.isFunction(options)) {
            cb      = options;
            options = {};
        }

        //validate
        var self = this;
        self.validate(navItem, function(err, validationErrors) {
            if (util.isError(err)) {
                return cb(err);
            }
            else if (validationErrors.length > 0) {
                return cb(null, validationErrors);
            }

            //persist the changes
            self.siteQueryService.save(navItem, function(err, data) {
                if(util.isError(err)) {
                    return cb(err);
                }

                //update the navigation map
                self.updateNavMap(navItem, function(err, orphans) {
                    if (util.isError(err)) {
                        return cb(err);
                    }
                    else if (orphans.length === 0) {
                        //we kept the children so there is nothing to do
                        return cb(null, true);
                    }

                    //ok, now we can delete the orhphans if they exist
                    self.deleteChildren(navItem[pb.DAO.getIdField()], cb);
                });
            });
        });
    };

    /**
     *
     * @static
     * @method getSectionData
     * @param {String} uid
     * @param {Object} navItems
     * @param {String} currUrl
     */
    SectionService.getSectionData = function(uid, navItems, currUrl) {
        var self = this;
        for(var i = 0; i < navItems.length; i++) {

            var navItem = navItems[i];
            if(navItem[pb.DAO.getIdField()].toString() === uid) {
                SectionService.formatUrl(navItem);

                //check for URL comparison
                if (currUrl === navItem.url) {
                    navItem.active = true;
                }
                return navItem;
            }
        }
        return null;
    };

    /**
     *
     * @static
     * @method formatUrl
     * @param {Object} navItem
     */
    SectionService.formatUrl = function(navItem) {
        if (util.isString(navItem.link)) {
            navItem.url = navItem.link;
        }
        else if(navItem.url)
        {
            navItem.url = pb.UrlService.urlJoin('/section', navItem.url);
        }
        else if (navItem.type === 'article') {
            navItem.url = pb.UrlService.urlJoin('/article', navItem.item);
        }
        else if (navItem.type === 'page') {
            navItem.url = pb.UrlService.urlJoin('/page', navItem.item);
        }
        else {
            navItem.url = '#' + (navItem.name || '');
        }
    };

    /**
     * @static
     * @method
     * @param {Localization} ls
     * @return {array}
     */
    SectionService.getTypes = function(ls) {
        if (!ls) {
            ls = new pb.Localization();
        }

        return [
            {
                value: "container",
                label: ls.get('CONTAINER')
            },
            {
                value: "section",
                label: ls.get('SECTION')
            },
            {
                value: "article",
                label: ls.get('ARTICLE')
            },
            {
                value: "page",
                label: ls.get('PAGE')
            },
            {
                value: "link",
                label: ls.get('LINK')
            },
        ];
    };

    /**
     * @static
     * @method isValidType
     * @param {String}|{Object} type
     * @return {Boolean}
     */
    SectionService.isValidType = function(type) {
        if (util.isObject(type)) {
            type = type.type;
        }

        return VALID_TYPES[type] === true;
    };

    //exports
    return SectionService;
};
