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
var async = require('async');
var AsyncEventEmitter = require('async-eventemitter');
var Sanitizer = require('sanitize-html');
var ErrorUtils = require('../error/error_utils');
var TaskUtils = require('../../lib/utils/taskUtils');
var log = require('../utils/logging').newInstance('BaseObjectService');

module.exports = function(pb) {

    //pb Dependencies
    var events = new AsyncEventEmitter();

    /**
     * Provides functionality to perform CRUD operations on collections.  It
     * also allows for plugins to register for events in order to interact with
     * objects as they are being processed.  This makes it possible to add,
     * remove, or modify fields before they are passed to the entity that
     * triggered the operation.
     * @class BaseObjectService
     * @constructor
     * @param {Object} context
     * @param {String} context.type
     */
    class BaseObjectService {
        constructor(context) {
            this.context = context;

            //error checking
            if (!_.isObject(context)) {
                throw new Error('The context parameter must be an object');
            }
            else if (!_.isString(context.type)) {
                throw new Error('The context.type parameter must be a string');
            }

            /**
             * Represents the name of the collection to interact with
             * @type {String}
             */
            this.type = context.type;

            /**
             * @type {string}
             */
            this.site = context.site;

            /**
             * @type {boolean}
             */
            this.onlyThisSite = context.onlyThisSite;

            /**
             * An instance of DAO to be used to interact with the persistence layer
             * @type {DAO}
             */
            this.dao = new pb.SiteQueryService({site: context.site, onlyThisSite: context.onlyThisSite});
        }

        /**
         * The maximum allowed number of results allowed to be returned when using
         * the paging wrapper
         * @readonly
         * @type {Integer}
         */
        static get MAX_RESULTS() {
            return 1000;
        }

        /**
         * The event that is triggered before the count query is executed
         * @readonly
         * @type {String}
         */
        static get BEFORE_COUNT() {
            return "beforeCount";
        }

        /**
         * The event that is triggered before the query is executed to retrieve
         * results
         * @readonly
         * @type {String}
         */
        static get BEFORE_GET_ALL() {
            return "beforeGetAll";
        }

        /**
         * The event that is triggered when querying for one or more resources
         * @readonly
         * @type {String}
         */
        static get GET_ALL() {
            return "getAll";
        }

        /**
         * The event that is triggered before the query is executed to retrieve
         * an item by ID
         * @readonly
         * @type {String}
         */
        static get BEFORE_GET() {
            return "beforeGet";
        }

        /**
         * The event that is triggered when retrieving a resource by ID
         * @readonly
         * @type {String}
         */
        static get GET() {
            return "get";
        }

        /**
         * The event that is triggered when a DTO is passed to the save function
         * @readonly
         * @type {String}
         */
        static get FORMAT() {
            return "format";
        }

        /**
         * The event that is triggered when a DTO is passed to the save function
         * and after the format event has completed
         * @readonly
         * @type {String}
         */
        static get MERGE() {
            return "merge";
        }

        /**
         * The event that is triggered when a DTO is passed to the save function
         * and after the merge event has completed
         * @readonly
         * @type {String}
         */
        static get VALIDATE() {
            return "validate";
        }

        /**
         * The event that is triggered when a DTO is passed to the save function
         * and aftr the validate event has completed.  When validation failures
         * occur this event will not fire.
         * @readonly
         * @type {String}
         */
        static get BEFORE_SAVE() {
            return "beforeSave";
        }

        /**
         * The event that is triggered when a DTO is passed to the save function
         * and after the save operation has completed successfully.
         * @readonly
         * @type {String}
         */
        static get AFTER_SAVE() {
            return "afterSave";
        }

        /**
         * The event that is triggered when the delete function is called.
         * @readonly
         * @type {String}
         */
        static get BEFORE_DELETE() {
            return "beforeDelete";
        }

        /**
         * The event that is triggered when the delete function is called and after
         * the delete operation has completed successfully.
         * @readonly
         * @type {String}
         */
        static get AFTER_DELETE() {
            return "afterDelete";
        }

        /**
         * Retrieves the object type supported by the service
         * @return {String} The object type supported
         */
        getType () {
            return this.type;
        }

        /**
         * Retrieves a context object to be passed to event listeners
         * @param {String|Object|Number|Boolean} [data]
         * @return {Object}
         */
        getContext(data) {
            return Object.assign({
                service: this,
                data: data
            }, this.context);
        }

        /**
         * Executes a query for resources against the persistence layer. The
         * function will callback with an array of results.  The function will
         * trigger the "getAll" event.  Also note that there is hard limit on the
         * number of results the returned.
         * @param {Object} [options]
         * @param {Object} [options.select]
         * @param {Object} [options.where]
         * @param {Array} [options.order]
         * @param {Integer} [options.limit]
         * @param {Integer} [options.offset]
         * @param {Function} cb A callback that takes two parameters.  The first is
         * an error, if occurred. The second is an array representing the results
         * of the query.
         */
        getAll (options, cb) {
            if (_.isFunction(options)) {
                cb = options;
                options = {};
            }

            //fire off the beforeGetAll event to allow plugins to modify queries
            var self = this;
            var context = this.getContext(options);
            self._emit(BaseObjectService.BEFORE_GET_ALL, context, function (err) {
                if (_.isError(err)) {
                    return cb(err);
                }

                //set a reasonable limit
                //TODO evaluate if this should be at the service level or controller
                //level
                var limit = BaseObjectService.getLimit(options.limit);

                var opts = {
                    select: options.select,
                    where: options.where,
                    order: options.order,
                    limit: limit,
                    offset: options.offset
                };
                self.dao.q(self.type, opts, function (err, results) {
                    if (_.isError(err)) {
                        return cb(err);
                    }

                    context.data = results;
                    self._emit(BaseObjectService.GET_ALL, context, function (err) {
                        cb(err, results);
                    });
                });
            });
        }

        /**
         * Executes a count of resources against the persistence layer. The
         * function will callback with an array of results.
         * @param {Object} [options]
         * @param {Object} [options.where]
         * @param {Function} cb A callback that takes two parameters.  The first is
         * an error, if occurred. The second is the number of results that match
         * the specified query
         */
        count (options, cb) {
            if (_.isFunction(options)) {
                cb = options;
                options = {};
            }

            var self = this;
            var context = this.getContext(options);
            this._emit(BaseObjectService.BEFORE_COUNT, context, function (err) {
                if (_.isError(err)) {
                    return cb(err);
                }

                self.dao.count(self.type, options.where, cb);
            });
        }

        /**
         * Executes a query for resources against the persistence layer. The
         * function will callback with an object that contains a total count and an
         * array of results.  The function will trigger the "getAll" event.  Also
         * note that there is hard limit on the number of results the returned.
         * @param {Object} [options]
         * @param {Object} [options.select]
         * @param {Object} [options.where]
         * @param {Array} [options.order]
         * @param {Integer} [options.limit]
         * @param {Integer} [options.offset]
         * @param {Function} cb A callback that takes two parameters.  The first is
         * an error, if occurred. The second is an object representing the results
         * of the query.
         */
        getAllWithCount (options, cb) {
            if (_.isFunction(options)) {
                cb = options;
                options = {};
            }

            var tasks = {

                data: TaskUtils.wrapTask(this, this.getAll, [options]),

                total: TaskUtils.wrapTask(this, this.count, [options])
            };
            async.parallel(tasks, function (err, pageDetails) {
                if (_.isError(err)) {
                    return cb(err);
                }

                pageDetails = BaseObjectService.getPagedResult(pageDetails.data, pageDetails.total, BaseObjectService.getLimit(options.limit), options.offset || 0);
                cb(null, pageDetails);
            });
        }

        /**
         * Retrieves a resource by ID. The function will callback with the object
         * that was found or NULL if no object could be found. The function will
         * trigger the "get" event.
         * @param {string} id
         * @param {object} [options]
         * @param {Function} cb (Error, object|null) A callback that takes two parameters.  The first is
         * an error, if occurred. The second is the object with the specified ID
         */
        get(id, options, cb) {
            if (_.isFunction(options)) {
                cb = options;
                options = {};
            }

            //set the id in the options so that plugins can inspect the ID
            var self = this;
            options.id = id;

            //fire before event so that plugins can modify the options and perform any validations
            var context = this.getContext(options);
            this._emit(BaseObjectService.BEFORE_GET, context, function (err) {
                if (_.isError(err)) {
                    return cb(err);
                }

                self._get(id, options, function (err, obj) {
                    if (_.isError(err)) {
                        return cb(err);
                    }

                    context.data = obj;
                    self._emit(BaseObjectService.GET, context, function (err) {
                        cb(err, obj);
                    });
                });
            });
        }

        /**
         * @private
         * @param {String} id
         * @param {Object} [options]
         * @param {Function} cb
         */
        _get(id, options, cb) {
            this.dao.loadById(id, this.type, options, cb);
        }

        /**
         * Retrieves a single resource by the specified query. The function will
         * callback with the object that was found or NULL if no object could be
         * found. The function will trigger the "getAll" event.
         * @param {Object} [options]
         * @param {Object} [options.select]
         * @param {Object} [options.where]
         * @param {Array} [options.order]
         * @param {Integer} [options.offset]
         * @param {Function} cb A callback that takes two parameters.  The first is
         * an error, if occurred. The second is the object that matches the specified query
         */
        getSingle(options, cb) {
            if (_.isFunction(options)) {
                cb = options;
                options = {};
            }
            options.limit = 1;

            this.getAll(options, function (err, results) {
                cb(err, Array.isArray(results) && results.length ? results[0] : null);
            });
        }

        /**
         * Attempts to persist the DTO as an add.  The function executes a series of events:
         * 1) The format event is fired
         * 2) When an ID is provided the object is retrieved from the database otherwise a new object is created.
         * 3) The merge event is triggered
         * 4) The validate event is triggered. If validation errors are detected the process halts and the function calls back with an error.
         * 5) The beforeSave event is triggered
         * 6) The object is persisted
         * 7) The afterSave event is triggered
         *
         * @param {object} dto
         * @param {Object} [options]
         * @param {Function} cb A callback that takes two parameters.  The first is
         * an error, if occurred. The second is the object that matches the specified query
         */
        add(dto, options, cb) {
            if (_.isFunction(options)) {
                cb = options;
                options = {};
            }
            options.isCreate = true;
            this.save(dto, options, cb);
        }

        /**
         * Attempts to persist the DTO as an update.  The function executes a series of events:
         * 1) The format event is fired
         * 2) When an ID is provided the object is retrieved from the database otherwise a new object is created.
         * 3) The merge event is triggered
         * 4) The validate event is triggered. If validation errors are detected the process halts and the function calls back with an error.
         * 5) The beforeSave event is triggered
         * 6) The object is persisted
         * 7) The afterSave event is triggered
         *
         * @param {object} dto
         * @param {Object} [options]
         * @param {Function} cb A callback that takes two parameters.  The first is
         * an error, if occurred. The second is the object that matches the specified query
         */
        update(dto, options, cb) {
            if (_.isFunction(options)) {
                cb = options;
                options = {};
            }
            options.isCreate = false;
            this.save(dto, options, cb);
        }

        /**
         * Attempts to persist the DTO.  The function executes a series of events:
         * 1) The format event is fired
         * 2) When an ID is provided the object is retrieved from the database otherwise a new object is created.
         * 3) The merge event is triggered
         * 4) The validate event is triggered. If validation errors are detected the process halts and the function calls back with an error.
         * 5) The beforeSave event is triggered
         * 6) The object is persisted
         * 7) The afterSave event is triggered
         *
         * @param {object} dto
         * @param {Object} [options]
         * @param {Boolean} [options.isCreate]
         * @param {Function} cb A callback that takes two parameters.  The first is
         * an error, if occurred. The second is the object that matches the specified query
         */
        save(dto, options, cb) {
            if (_.isFunction(options)) {
                cb = options;
                options = {};
            }

            //basic error checking
            if (_.isNil(dto)) {
                return cb(new Error('The dto parameter cannnot be null'));
            }

            //do any object formatting that should be done before validation
            var self = this;
            var context = this.getContext(dto);
            context.isCreate = _.isBoolean(options.isCreate) ? options.isCreate : _.isNil(dto[pb.DAO.getIdField() || dto.id]);
            context.isUpdate = !context.isCreate;
            self._emit(BaseObjectService.FORMAT, context, function (err) {
                if (_.isError(err)) {
                    return cb(err);
                }

                //detect if we are doing an update or insert.  On update retrieve
                //the obj and call the merge event handlers
                self._retrieveOnUpdateAndMerge(dto, options, function (err, obj) {
                    if (_.isError(err) || _.isNil(obj)) {
                        return cb(err, obj);
                    }

                    //remove the dto from context and set the obj as the data to focus on
                    context.data = obj;
                    context.validationErrors = [];

                    //perform all validations
                    self._emit(BaseObjectService.VALIDATE, context, function (err) {
                        if (_.isError(err)) {
                            return cb(err);
                        }

                        //check for validation errors
                        var validationErrors = BaseObjectService.consolidateValidationResults(context.validationErrors);
                        if (validationErrors.length) {
                            return cb(BaseObjectService.validationError(validationErrors));
                        }

                        //do any pre-save stuff
                        self._emit(BaseObjectService.BEFORE_SAVE, context, function (err) {
                            if (_.isError(err)) {
                                return cb(err);
                            }

                            //persist the object
                            options.object_type = self.type;
                            self.dao.save(obj, options, function (err/*, result*/) {
                                if (_.isError(err)) {
                                    return cb(err);
                                }

                                //do any pre-save stuff
                                self._emit(BaseObjectService.AFTER_SAVE, context, function (err) {
                                    cb(err, obj);
                                });
                            });
                        });
                    });
                });
            });
        }

        /**
         * When an ID is available in the DTO the function attempts to retrieve the
         * existing object.  If it is not available a new object is created.  The
         * merge event is then called.  After the merge is complete the callback is
         * executed with the merged object.
         * @private
         * @param {Object} dto
         * @param {Object} options
         * @param {Boolean} [options.isCreate]
         * @param {Function} cb
         */
        _retrieveOnUpdateAndMerge(dto, options, cb) {

            //function used as callback handler so we can simplify if/else logic
            var self = this;
            var where = this.getIdWhere(dto);
            var isCreate = _.isBoolean(options.isCreate) ? options.isCreate : !where;
            var isUpdate = !isCreate;

            //ensure we have a valid where clause for update
            if (isUpdate && (_.isNil(where) || where === {})) {

                var error = BaseObjectService.validationError(
                    [BaseObjectService.validationFailure('id', 'A valid ID could not be extracted from the request body to lookup the existing resource')]
                );
                return cb(error);
            }

            var onObjectRetrieved = function (err, obj) {
                if (_.isError(err) || _.isNil(obj)) {
                    return cb(err, obj);
                }

                var context = self.getContext(dto);
                context.object = obj;
                context.isUpdate = isUpdate;
                context.isCreate = isCreate;

                self._emit(BaseObjectService.MERGE, context, function (err) {
                    cb(err, obj);
                });
            };

            //when we are doing an update load the object
            if (isUpdate) {
                this.dao.loadByValues(where, this.type, onObjectRetrieved);
            }
            else {

                //we are creating a new object so pass it along
                onObjectRetrieved(null, {});
            }
        }

        /**
         * Creates the where clause that creates a lookup by the key that indicates
         * uniqueness for the collection
         * @param {Object} dto
         * @return {Object}
         */
        getIdWhere(dto) {
            var idField = pb.DAO.getIdField();
            if (dto.id) {
                return pb.DAO.getIdWhere(dto.id);
            }
            else if (dto[idField]) {
                return pb.DAO.getIdWhere(dto[idField]);
            }
            return null;
        }

        /**
         * Deletes an object by ID
         * @param {String} id
         * @param {Object} options
         * @param {Function} cb
         */
        deleteById(id, options, cb) {
            if (_.isFunction(options)) {
                cb = options;
                options = {};
            }
            options.where = pb.DAO.getIdWhere(id);

            this.deleteSingle(options, cb);
        }

        /**
         * Deletes a single item based on the specified query in the options
         * @param {Object} [options] See BaseObjectService#getSingle
         * @param {object} [options.where]
         * @param {Function} cb
         */
        deleteSingle(options, cb) {
            if (_.isFunction(options)) {
                cb = options;
                options = {};
            }

            var self = this;
            this.getSingle(options, function (err, obj) {
                if (_.isError(err) || _.isNil(obj)) {
                    return cb(err, obj);
                }

                var context = self.getContext(obj);
                self._emit(BaseObjectService.BEFORE_DELETE, context, function (err) {
                    if (_.isError(err)) {
                        return cb(err, null);
                    }

                    self.dao.delete(options.where, self.type, options, function (err/*, result*/) {
                        if (_.isError(err)) {
                            return cb(err, obj);
                        }

                        self._emit(BaseObjectService.AFTER_DELETE, context, function (err) {
                            cb(err, obj);
                        });
                    });
                });
            });
        }

        /**
         *
         * @protected
         * @param {String} event
         * @param {Object} data
         * @param {Function} cb
         */
        _emit(event, data, cb) {
            log.silly('BaseObjectService: Emitting events: [%s, %s.%s]', event, this.type, event);

            var self = this;
            var tasks = [];

            //global events
            if (events.listeners(event).length > 0) {
                tasks.push(function (callback) {
                    events.emit(event, data, callback);
                });
            }

            //object specific
            var eventName = self.type + '.' + event;
            if (events.listeners(eventName).length > 0) {
                tasks.push(function (callback) {

                    events.emit(eventName, data, callback);
                });
            }
            async.series(tasks, cb);
        }

        /**
         * Creates a properly formed validation failure
         * @param {String} field
         * @param {String} message
         * @param {String} [code]
         */
        static validationFailure(field, message, code) {
            return {
                field: field || null,
                message: message || '',
                code: code || null
            };
        }

        /**
         * Inspects the raw set of validation results to ensure that plugins that
         * don't follow proper procedure have their results excluded.
         * @param {Array} results
         * @return {Array}
         */
        static consolidateValidationResults(results) {
            if (!Array.isArray(results)) {
                return null;
            }

            //filter out any malformed validation results from plugins
            var validationErrors = [];
            results.forEach(function (validationError) {
                if (!_.isObject(validationError)) {
                    return;
                }
                validationErrors.push(validationError);
            });

            return validationErrors;
        }

        /**
         * Creates a new Error representative of a validation error
         * @param {Array|string} validationFailures
         * @return {Error}
         */
        static validationError(validationFailures) {
            return ErrorUtils.badRequest({message: 'Validation Failure', validationErrors: validationFailures});
        }

        /**
         * Strips HTML formatting from a string value
         * @param {String} value
         * @param {Object} [config]
         * @return {String}
         */
        static sanitize(value, config) {
            if (!value) {
                return value;
            }
            else if (!_.isObject(config)) {
                config = BaseObjectService.getDefaultSanitizationRules();
            }
            return Sanitizer(value, config);
        }

        /**
         * The sanitization rules that apply to Pages, Articles, and other fields
         * that are allowed to have HTML
         * @return {Object}
         */
        static getContentSanitizationRules() {
            return contentSanitizationRulesOverride || {
                    allowedTags: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol', 'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div', 'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'img', 'u', 'span'],
                    allowedAttributes: {
                        a: ['href', 'name', 'target', 'class', 'align'],
                        img: ['src', 'class', 'align'],
                        p: ['align', 'class'],
                        h1: ['style', 'class', 'align'],
                        h2: ['style', 'class', 'align'],
                        h3: ['style', 'class', 'align'],
                        h4: ['style', 'class', 'align'],
                        h5: ['style', 'class', 'align'],
                        h6: ['style', 'class', 'align'],
                        div: ['style', 'class', 'align'],
                        span: ['style', 'class', 'align'],
                        table: ['style', 'class', 'align'],
                        tr: ['style', 'class', 'align'],
                        th: ['style', 'class', 'align'],
                        td: ['style', 'class', 'align']
                    },

                    // Lots of these won't come up by default because we don't allow them
                    selfClosing: ['img', 'br', 'hr', 'area', 'base', 'basefont', 'input', 'link', 'meta'],

                    // URL schemes we permit
                    allowedSchemes: ['http', 'https', 'ftp', 'mailto']
                };
        }

        /**
         * Sets a system-wide override for the set of sanitization rules for content.  The function will throw if a non-object
         * is passed.  NULL can be used to reset any override that is put into place.
         * @param {object} rules
         */
        static setContentSanitizationRules (rules) {
            if (typeof rules !== 'object' || Array.isArray(rules)) {
                throw new Error('The content sanitization rules must be an object or null');
            }
            contentSanitizationRulesOverride = rules;
        }

        /**
         * Sets a system-wide override for the default set of sanitization rules.  The function will throw if a non-object
         * is passed.  NULL can be used to reset any override that is put into place.
         * @param {object} rules
         */
        static setDefaultSanitizationRules(rules) {
            if (typeof rules !== 'object' || Array.isArray(rules)) {
                throw new Error('The default sanitization rules must be an object or null');
            }
            defaultSanitizationRulesOverride = rules;
        }

        /**
         * Retrieves the default sanitization rules for string fields.
         * @return {Object}
         */
        static getDefaultSanitizationRules() {
            return defaultSanitizationRulesOverride || {
                    allowedTags: [],
                    allowedAttributes: {}
                };
        }

        /**
         * Parses an ISO date string.  When an invalid date string is pass a NULL
         * value is returned.
         * @param {String} dateStr
         * @return {Date}
         */
        static getDate(dateStr) {
            var val = Date.parse(dateStr);
            return isNaN(val) ? null : new Date(val);
        }

        /**
         * Determines the maximum number of results that can be returned for a
         * query.  The specified limit must be a positive integer.  The result will
         * be the minimum of the MAX_RESULTS constant and the specified limit.
         * @param {Integer} limit
         * @return {Integer}
         */
        static getLimit(limit) {
            return _.isNil(limit) || isNaN(limit) || limit <= 0 ?
                BaseObjectService.MAX_RESULTS : Math.min(limit, BaseObjectService.MAX_RESULTS);
        }

        /**
         * Builds a paged result object
         * @param {Array} dataArray The array of items to return
         * @param {Integer} total The total number of items available in the collection
         * @param {Integer} [limit] The maximum number of items to return
         * @param {Integer} [offset] The number of items skipped
         */
        static getPagedResult(dataArray, total, limit, offset) {
            return {
                count: dataArray.length,
                data: dataArray,
                total: total,
                limit: limit,
                offset: offset
            };
        }

        /**
         * Extracts a boolean value from the provided value.  Null or undefined values will return false.  Strings of '1' or
         * 'true' (case sensitive) will return TRUE.  All other values will return false.
         * @param {string|boolean} val
         * @return {boolean}
         */
        static parseBoolean(val) {
            if (_.isNil(val)) {
                return false;
            }
            if (_.isBoolean(val)) {
                return val;
            }

            //check for other truths
            switch (val) {
                case '1':
                case 'true':
                case 1:
                    return true;
                default:
                    return false;
            }
        }

        /**
         * Registers a listener for the specified event.
         * @param {String} event
         * @param {Function} listener
         * @return {*}
         */
        static on(event, listener) {
            return events.on(event, listener);
        }

        /**
         * Registers a listener to fire a single time for the specfied event
         * @param {String} event
         * @param {Function} listener
         * @return {*}
         */
        static once(event, listener) {
            return events.once(event, listener);
        }

        /**
         * Removes the listener from the specified event
         * @param {String} event
         * @param {Function} listener
         * @return {*}
         */
        static removeListener(event, listener) {
            return events.removeListener(event, listener);
        }

        /**
         * Removes all listeners for the specified event
         * @param {String} event
         * @return {*}
         */
        static removeAllListeners(event) {
            return events.removeAllListeners(event);
        }

        /**
         * Sets the maximum number of listeners for the emitter
         * @param {Integer} n
         * @return {EventEmitter}
         */
        static setMaxListeners(n) {
            return events.setMaxListeners(n);
        }

        /**
         * Returns a list of the listeners for the specified event
         * @param {String} event
         * @return {Array}
         */
        static listeners(event) {
            return events.listeners(event);
        }
    }

    var contentSanitizationRulesOverride = null;
    var defaultSanitizationRulesOverride = null;

    return BaseObjectService;
};
