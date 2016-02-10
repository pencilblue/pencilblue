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

//dependencies
var util = require('../../util.js');

module.exports = function(pb) {

    //pb dependencies
    var BaseObjectService = pb.BaseObjectService;

    /**
     * @private
     * @static
     * @readonly
     * @property TYPE
     * @type {String}
     */
    var TYPE = 'navigation_item';

    var CONTAINER = 'container';
    var SECTION = 'section';
    var LINK = 'link';
    var ARTICLE = 'article';
    var PAGE = 'page';

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
     * Provides interactions with topics
     * @class NavigationItemService
     * @extends BaseObjectService
     * @constructor
     * @param {Object} context
     */
    function NavigationItemService(context) {
        if (!util.isObject(context)) {
            context = {};
        }

        context.type = TYPE;
        NavigationItemService.super_.call(this, context);
    }
    util.inherits(NavigationItemService, BaseObjectService);

    /**
     *
     * @method validate
     * @param {Object} navItem
     * @param {Function} cb
     */
    NavigationItemService.prototype.validate = function(navItem, cb) {
        var self   = this;
        var errors = [];
        if (!util.isObject(navItem)) {
            errors.push({field: '', message: 'A valid navigation item must be provided'});
            cb(null, errors);
            return;
        }

        //verify type
        if (!NavigationItemService.isValidType(navItem.type)) {
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
    NavigationItemService.prototype.validateLinkNavItem = function(navItem, cb) {
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
    NavigationItemService.prototype.validateNavItemName = function(navItem, cb) {
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
    NavigationItemService.prototype.validateContentNavItem = function(navItem, cb) {
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
    NavigationItemService.prototype.validateSectionNavItem = function(navItem, cb) {
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
    NavigationItemService.prototype.validateNavItemParent = function(parent, cb) {

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
    NavigationItemService.prototype.validateNavItemContent = function(type, content, cb) {

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
    NavigationItemService.prototype.validateNavItemEditor = function(editor, cb) {

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
     * @static
     * @method
     * @param {Object} context
     * @param {NavigationItemService} service An instance of the service that triggered
     * the event that called this handler
     * @param {Function} cb A callback that takes a single parameter: an error if occurred
     */
    NavigationItemService.format = function(context, cb) {
        var dto = context.data;
        dto.name = pb.BaseController.sanitize(dto.name);
        cb(null);
    };

    /**
     *
     * @static
     * @method
     * @param {Object} context
     * @param {NavigationItemService} service An instance of the service that triggered
     * the event that called this handler
     * @param {Function} cb A callback that takes a single parameter: an error if occurred
     */
    NavigationItemService.merge = function(context, cb) {
        context.object.name = context.data.name;
        cb(null);
    };

    /**
     *
     * @static
     * @method validate
     * @param {Object} context
     * @param {Object} context.data The DTO that was provided for persistence
     * @param {NavigationItemService} context.service An instance of the service that triggered
     * the event that called this handler
     * @param {Function} cb A callback that takes a single parameter: an error if occurred
     */
    NavigationItemService.validate = function(context, cb) {
        var obj = context.data;
        var errors = context.validationErrors;

        if (!pb.ValidationService.isNonEmptyStr(obj.name, true)) {
            errors.push(BaseObjectService.validationFailure('name', 'Name is required'));

            //no need to check the DB.  Short circuit it here
            return cb(null, errors);
        }

        //validate name is not taken
        var where = pb.DAO.getNotIdWhere(obj[pb.DAO.getIdField()]);
        where.name = new RegExp('^' + util.escapeRegExp(obj.name) + '$', 'i');
        context.service.dao.exists(TYPE, where, function(err, exists) {
            if (util.isError(err)) {
                return cb(err);
            }
            else if (exists) {
                errors.push(BaseObjectService.validationFailure('name', 'Name already exists'));
            }
            cb(null, errors);
        });
    };

    /**
     * @static
     * @method isValidType
     * @param {String}|{Object} type
     * @return {Boolean}
     */
    NavigationItemService.isValidType = function(type) {
        if (util.isObject(type)) {
            type = type.type;
        }

        return VALID_TYPES[type] === true;
    };

    /**
     * @static
     * @method
     * @param {Localization} ls
     * @return {array}
     */
    NavigationItemService.getTypes = function(ls) {
        if (util.isNullOrUndefined(ls)) {
            throw new Error('Parameter ls is required');
        }

        return [
            {
                value: CONTAINER,
                label: ls.g('generic.CONTAINER')
            },
            {
                value: SECTION,
                label: ls.g('generic.SECTION')
            },
            {
                value: ARTICLE,
                label: ls.g('generic.ARTICLE')
            },
            {
                value: PAGE,
                label: ls.g('generic.PAGE')
            },
            {
                value: LINK,
                label: ls.g('generic.LINK')
            },
        ];
    };

    /**
     *
     * @static
     * @method trimForType
     * @param {Object} navItem
     */
    NavigationItemService.trimForType = function(navItem) {
        if (navItem.type === CONTAINER) {
            navItem.parent = null;
            navItem.url    = null;
            navItem.editor = null;
            navItem.item   = null;
            navItem.link   = null;
            navItem.new_tab = null;
        }
        else if (navItem.type === SECTION) {
            navItem.item = null;
            navItem.link = null;
            navItem.new_tab = null;
        }
        else if (navItem.type === ARTICLE || navItem.type === PAGE) {
            navItem.link   = null;
            navItem.url    = null;
            navItem.editor = null;
            navItem.new_tab = null;
        }
        else if (navItem.type === LINK) {
            navItem.editor = null;
            navItem.url    = null;
            navItem.item   = null;
        }
    };

    //Event Registries
    BaseObjectService.on(TYPE + '.' + BaseObjectService.FORMAT, NavigationItemService.format);
    BaseObjectService.on(TYPE + '.' + BaseObjectService.MERGE, NavigationItemService.merge);
    BaseObjectService.on(TYPE + '.' + BaseObjectService.VALIDATE, NavigationItemService.validate);

    //exports
    return NavigationItemService;
};
