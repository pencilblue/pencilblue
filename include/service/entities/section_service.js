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
var async   = require('async');
var util    = require('../../util.js');


module.exports = function SectionServiceModule(pb) {


    /**
     * Service for managing the site's navigation
     * @class SectionService
     * @constructor
     * @param {object} options
     * @param {String} options.site uid
     * @param {Boolean} options.onlyThisSite should section service only return value set specifically by site rather than defaulting to global
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
     * update navigation sections paths
     */
    SectionService.updateSectionsPaths = function () {
        var site = pb.SettingServiceFactory.getServiceBySite(pb.SiteService.GLOBAL_SITE, false).get('section_map', function(err, sectionMap) {
            new pb.SiteQueryService({site: site, onlyThisSite: false}).q('section', function(err, sections) {
                pb.RequestHandler.sectionsPaths = SectionService.getPathsSections(sectionMap, sections);

            });
        });

    }

    /**
     *
     * @static
     * @method getPillNavOptions
     * @param {String} activePill
     * @return {Array}
     */
    SectionService.getPillNavOptions = function(/*activePill*/) {
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
            cb = sectionMap;
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
            else if (sectionMap === null) {
                cb(new Error("The section map is null and therefore cannot have any sections removed", false));
                return;
            }

            //update map
            var orphans = self._removeFromSectionMap(section, sectionMap);

            //when the section map was not provided persist it back
            if (sectionMapWasNull) {
                self.settings.set('section_map', sectionMap, function(err/*, result*/) {
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
         var removeFromSectionMap = function(items){
          for (var i = 0; i < items.length; i++){
            var item = items[i];
            if (item.uid === sid){
              items.splice(i, 1);
              util.arrayPushAll(item.children, orphans);
            }else if(util.isArray(item.children)){
               removeFromSectionMap(item.children);
            }
          }

        }

        removeFromSectionMap(sectionMap);

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
     * Get array paths navigation sections
     * @param  {Array} sectionMap
     * @param  {Array} sections
     * @return {Object}
     */
    SectionService.getPathsSections = function(sectionMap, sections){
        var result = {};

        for (var i = 0; i < sectionMap.length; i++){
                var section = SectionService.getSectionData(sectionMap[i].uid, sections, '');
                if (section.type === 'container'){
                            var childrenPaths = SectionService.getPathsSections(sectionMap[i].children, sections);
                            if (childrenPaths){
                                for (var key in childrenPaths){

                                    if (section.use_in_path){
                                        var prefix = '/';
                                        if (childrenPaths[key].path[0] === prefix){
                                            prefix = '';
                                        }
                                        childrenPaths[key].path = '/' + section.path_name + prefix + childrenPaths[key].path;
                                    }
                                    if (result[childrenPaths[key].path]){
                                        continue;
                                    }
                                    result[childrenPaths[key].path] = {
                                        path : childrenPaths[key].path,
                                        section_path : childrenPaths[key].section_path
                                    };
                                };
                            }

                }else if (section.type === 'page' || section.type === 'section' || section.type === 'article'){
                     if (section.path_name){
                      if(section.path_name[0] !== '/'){
                        section.path_name = '/' + section.path_name;
                      }
                      if(!result[section.path_name]){
                        result[section.path_name] = {
                            path : section.path_name,
                            section_path : section.url
                        };
                      }
                        
                     }
                }else{
                    return null
                }

        }
        return result;
    }

    /**
     * Validate sectisonMap paths on no conflicts
     * @param  {Array}   sectionMap
     * @param  {Object}   section
     * @param  {Function} cb
     */
    SectionService.prototype.validationSectionMap = function(sectionMap, section, cb){
        var self = this;
        if (util.isFunction(section)) {
            cb = section;
            section = null;
        }
        self.siteQueryService.q('section', function(err, sections) {
            var newRoutes = [];
            if (section){

                if (section[pb.DAO.getIdField()]){
                    var sectionBase = SectionService.getSectionData(section[pb.DAO.getIdField()].toString(), sections);
                    sectionBase.url = undefined;
                    sectionBase.use_in_path = section.use_in_path;
                    sectionBase.name = section.name;
                    sectionBase.path_name = section.path_name;
                }else{
                    sections.push(section);
                }
            }
            Object.keys(SectionService.getPathsSections(sectionMap, sections)).forEach(function(route){
                route = '/' + (/^\/\w+/).exec(route);
                if (route && newRoutes.indexOf(route[0]) < 0){
                    newRoutes.push(route[0]);
                }
            })
            var staticRoutes = Object.keys(pb.RequestHandler.staticRoutes);
            for (var i = 0; i < staticRoutes.length; i++){
                var route = (/^\/\w+/).exec(staticRoutes[i]);

                if (route && newRoutes.indexOf(route[0]) > -1){
                    return cb(null, [{field: 'Navigation Element', message: 'Created duplicate path "'+route[0]+'"'}]);
                }
            }

             for (var i = 0; i < pb.RequestHandler.storage.length; i++) {
                var route = '/' + (/^\w+/).exec(pb.RequestHandler.storage[i].path);
                if (route && newRoutes.indexOf(route) > -1){

                    return cb(null, [{field: 'Navigation Element', message: 'Created duplicate path "'+route+'"'}]);
                }
             }
            cb(null, []);

        });




    }



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
            cb = currUrl;
            currUrl = null;
        }

        self.settings.get('section_map', function(err, sectionMap) {
            if (util.isError(err) || sectionMap === null) {
                cb(err, []);
                return;
            }

            //retrieve sections
            self.siteQueryService.q('section', function(err, sections) {
                if (util.isError(err)) {
                    return cb(err, []);
                }

                var formattedSections = [];
                var getSection = function(item){
                    var section = SectionService.getSectionData(item.uid, sections, currUrl);
                    if (util.isNullOrUndefined(section)) {
                        pb.log.error('SectionService: The navigation map is out of sync.  Section [%s] could not be found for site [%s].', item.uid, self.site);
                        return null;
                    }
                    if(item.children.length !== 0){
                        section.dropdown = 'dropdown';
                        section.children = [];
                        for(var i =0; i < item.children.length; i++){
                            var child = getSection(item.children[i]);
                            if (child.active){
                                section.active = true;
                            }
                            section.children.push(child);
                        }
                    }
                    return section;
                }
                for(var i = 0; i < sectionMap.length; i++){
                    var el = getSection(sectionMap[i]);
                    if(el){
                        formattedSections.push(el);
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
            order: ['name', pb.DAO.ASC]
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
            navItem.url    = null;
            navItem.editor = null;
            navItem.link   = null;
            navItem.new_tab = null;
            navItem.item = null;
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
            navItem.use_in_path = null;
            navItem.path_name =null;
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

        self.settings.get('section_map', function(err, sectionMap) {

            self.validationSectionMap(sectionMap, navItem, function (err, validationError){

                  if (util.isError(err)) {
                        cb(err, errors);
                        return;
                    }

                    if (validationError.length > 0) {
                        cb(err, validationError)
                        return;
                    }
                //name
                self.validateNavItemName(navItem, function(err, validationError) {

                    if (util.isError(err)) {
                        cb(err, errors);
                        return;
                    }

                    if (validationError) {
                        errors.push(validationError);
                    }

                    //description
                    if (!pb.validation.isNonEmptyStr(navItem.name, true)) {
                        errors.push({field: 'name', message: 'An invalid name ['+navItem.name+'] was provided'});
                    }
                    if (!pb.validation.isSafeFileName(navItem.path_name, true)) {
                        errors.push({field: 'path_name', message: 'An invalid name ['+navItem.path_name+'] was provided'});
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
            });
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
        if (!pb.validation.isUrl(navItem.link, true) && navItem.link.charAt(0) !== '/') {
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
        if (!pb.validation.isNonEmptyStr(navItem.name, true) || navItem.name === 'admin') {
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
        async.series(tasks, function(err/*, results*/) {
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
        async.series(tasks, function(err/*, results*/) {
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
        if (!pb.validation.isNonEmptyStr(parent, false)) {
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
        if (!pb.validation.isNonEmptyStr(content, true)) {
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
        if (!pb.validation.isNonEmptyStr(editor, true)) {
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
            cb = options;
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
                SectionService.updateSectionsPaths();
                return cb(null, true);
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
     * @return {Array}
     */
    SectionService.getTypes = function(ls) {
        if (!ls) {
            ls = new pb.Localization();
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
    };

    /**
     * @static
     * @method isValidType
     * @param {String|Object} type
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
