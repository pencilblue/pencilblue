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
var util              = require('../util.js');
var async             = require('async');
var AsyncEventEmitter = require('async-eventemitter');
var Sanitizer         = require('sanitize-html');

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
    function BaseObjectService(context){
        //TODO figure out what the context needs
        
        //error checking
        if (!util.isObject(context)) {
            throw new Error('The context parameter must be an object');
        }
        else if (!util.isString(context.type)) {
            throw new Error('The context.type parameter must be a string');
        }
        
        /**
         * Represents the name of the collection to interact with
         * @property type
         * @type {String}
         */
        this.type = context.type;
        
        /**
         * An instance of DAO to be used to interact with the persitence layer
         * @property dao
         * @type {DAO}
         */
        this.dao = new pb.DAO();
    }
    
    /**
     * The maximum allowed number of results allowed to be returned when using 
     * the paging wrapper
     * @private
     * @static
     * @readonly
     * @property MAX_RESULTS
     * @type {Integer}
     */
    var MAX_RESULTS = 250;
    
    /**
     * The event that is triggered when querying for one or more resources
     * @private
     * @static
     * @readonly
     * @property GET_ALL
     * @type {String}
     */
    BaseObjectService.GET_ALL = "getAll";
    
    /**
     * The event that is triggered when retrieving a resource by ID
     * @private
     * @static
     * @readonly
     * @property GET_ALL
     * @type {String}
     */
    BaseObjectService.GET = "get";
    
    /**
     * The event that is triggered when a DTO is passed to the save function
     * @private
     * @static
     * @readonly
     * @property FORMAT
     * @type {String}
     */
    BaseObjectService.FORMAT = "format";
    
    /**
     * The event that is triggered when a DTO is passed to the save function 
     * and after the format event has completed
     * @private
     * @static
     * @readonly
     * @property MERGE
     * @type {String}
     */
    BaseObjectService.MERGE = "merge";
    
    /**
     * The event that is triggered when a DTO is passed to the save function
     * and after the merge event has completed
     * @private
     * @static
     * @readonly
     * @property VALIDATE
     * @type {String}
     */
    BaseObjectService.VALIDATE = "validate";
    
    /**
     * The event that is triggered when a DTO is passed to the save function
     * and aftr the validate event has completed.  When validation failures 
     * occur this event will not fire.
     * @private
     * @static
     * @readonly
     * @property BEFORE_SAVE
     * @type {String}
     */
    BaseObjectService.BEFORE_SAVE = "beforeSave";
    
    /**
     * The event that is triggered when a DTO is passed to the save function
     * and after the save operation has completed successfully.
     * @private
     * @static
     * @readonly
     * @property AFTER_SAVE
     * @type {String}
     */
    BaseObjectService.AFTER_SAVE = "afterSave";
    
    /**
     * The event that is triggered when the delete function is called.
     * @private
     * @static
     * @readonly
     * @property BEFORE_DELETE
     * @type {String}
     */
    BaseObjectService.BEFORE_DELETE = "beforeDelete";
    
    /**
     * The event that is triggered when the delete function is called and after
     * the delete operation has completed successfully.
     * @private
     * @static
     * @readonly
     * @property AFTER_DELETE
     * @type {String}
     */
    BaseObjectService.AFTER_DELETE = "afterDelete";
    
    /**
     * Executes a query for resources against the persistence layer. The 
     * function will callback with an array of results.  The function will 
     * trigger the "getAll" event.  Also note that there is hard limit on the 
     * number of results the returned.
     * @method getAll
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
    BaseObjectService.prototype.getAll = function(options, cb) {
        if (util.isFunction(options)) {
            cb      = options;
            options = {};
        }
        
        //set a reasonable limit
        //TODO evaluate if this should be at the service level or controller 
        //level
        var limit = util.isNullOrUndefined(options.limit) ? MAX_RESULTS : Math.min(options.limit, MAX_RESULTS);
        
        var self = this;
        var opts = {
            select: options.select,
            where: options.where,
            order: options.order,
            limit: limit,
            offset: options.offset
        };
        this.dao.q(this.type, opts, function(err, results) {
            if (util.isError(err)) {
                return cb(err);
            }
            
            var context = {
                service: self,
                data: results
            };
            events.emit(self.type + '.' + 'getAll', context, function(err) {
                cb(err, results);
            });
        });
    };
    
    /**
     * Executes a count of resources against the persistence layer. The 
     * function will callback with an array of results.  
     * @method count
     * @param {Object} [options]
     * @param {Object} [options.where]
     * @param {Function} cb A callback that takes two parameters.  The first is 
     * an error, if occurred. The second is the number of results that match 
     * the specified query
     */
    BaseObjectService.prototype.count = function(options, cb) {
        if (util.isFunction(options)) {
            cb      = options;
            options = {};
        }
        
        this.dao.count(this.type, options.where, cb);
    };
    
    /**
     * Executes a query for resources against the persistence layer. The 
     * function will callback with an object that contains a total count and an 
     * array of results.  The function will trigger the "getAll" event.  Also 
     * note that there is hard limit on the number of results the returned.
     * @method getAll
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
    BaseObjectService.prototype.getAllWithCount = function(options, cb) {
        if (util.isFunction(options)) {
            cb      = options;
            options = {};
        }
        
        var tasks = {
            
            data: util.wrapTask(this, this.getAll, [options]),
            
            total: util.wrapTask(this, this.count, [options])
        };
        async.parallel(tasks, function(err, pageDetails) {
            if (util.isError(err)) {
                return cb(err);
            }
            
            pageDetails.count = pageDetails.data.length;
            pageDetails.offset = options.offset || 0;
            pageDetails.limit = Math.min(options.limit, MAX_RESULTS);
            cb(null, pageDetails);
        });
    };
    
    /**
     * Retrieves a resource by ID. The function will callback with the object 
     * that was found or NULL if no object could be found. The function will 
     * trigger the "get" event.  
     * @method getAll
     * @param {Object} [options]
     * @param {Function} cb A callback that takes two parameters.  The first is 
     * an error, if occurred. The second is the object with the specified ID
     */
    BaseObjectService.prototype.get = function(id, options, cb) {
        if (util.isFunction(options)) {
            cb      = options;
            options = {};
        }
        
        var self = this;
        this.dao.loadById(id, this.type, options, function(err, obj) {
            if (util.isError(err)) {
                return cb(err);
            }
            
            var context = {
                service: self,
                data: obj
            };
            events.emit(self.type + '.' + 'get', context, function(err) {
                cb(err, obj);
            }); 
        });
    };
    
    /**
     * Retrieves a single resource by the specified query. The function will 
     * callback with the object that was found or NULL if no object could be 
     * found. The function will trigger the "getAll" event.  
     * @method getAll
     * @param {Object} [options]
     * @param {Object} [options.select]
     * @param {Object} [options.where]
     * @param {Array} [options.order]
     * @param {Integer} [options.offset]
     * @param {Function} cb A callback that takes two parameters.  The first is 
     * an error, if occurred. The second is the object that matches the specified query
     */
    BaseObjectService.prototype.getSingle = function(options, cb) {
        if (util.isFunction(options)) {
            cb      = options;
            options = {};
        }
        options.limit = 1;
        
        this.getAll(options, function(err, results) {
            cb(err, util.isArray(results) && results.length ? results[0] : null);
        });
    };
    
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
     * @method getAll
     * @param {Object} [options]
     * @param {Object} [options.select]
     * @param {Object} [options.where]
     * @param {Array} [options.order]
     * @param {Integer} [options.offset]
     * @param {Function} cb A callback that takes two parameters.  The first is 
     * an error, if occurred. The second is the object that matches the specified query
     */
    BaseObjectService.prototype.save = function(dto, options, cb) {
        if (util.isFunction(options)) {
            cb      = options;
            options = {};
        }
        
        //basic error checking
        if (util.isNullOrUndefined(dto)) {
            return cb(new Error('The dto parameter cannnot be null'));
        }
        
        //do any object formatting that should be done before validation
        var self    = this;
        var context = {
            service: self,
            data: dto
        };
        events.emit(self.type + '.' + 'format', context, function(err) {
            if (util.isError(err)) {
                return cb(err);
            }
            
            //detect if we are doing an update or insert.  On update retrieve 
            //the obj and call the merge event handlers
            self._retrieveOnUpdateAndMerge(dto, function(err, obj) {
                if (util.isError(err) || util.isNullOrUndefined(obj)) {
                    return cb(err, obj);
                }

                //remove the dto from context and set the obj as the data to focus on
                context.data             = obj;
                context.isCreate         = util.isNullOrUndefined(obj[pb.DAO.getIdField()]);
                context.isUpdate         = !context.isCreate;
                context.validationErrors = [];
                
                //perform all validations
                events.emit(self.type + '.' + 'validate', context, function(err) {
                    if (util.isError(err)) {
                        return cb(err);
                    }

                    //check for validation errors
                    var validationErrors = BaseObjectService.consolidateValidationResults(context.validationErrors);
                    if (validationErrors.length) {
                        return cb(BaseObjectService.validationError(validationErrors));
                    }
                    
                    //do any pre-save stuff
                    events.emit(self.type + '.' + 'beforeSave', context, function(err) {
                        if (util.isError(err)) {
                            return cb(err);
                        }
                    
                        //persist the object
                        options.object_type = self.type;
                        self.dao.save(obj, options, function(err, result) {
                            if (util.isError(err)) {
                                return cb(err);
                            }
                            
                            //do any pre-save stuff
                            events.emit(self.type + '.' + 'afterSave', context, function(err) {
                                cb(err, obj);
                            });
                        });
                    });
                });
            });
        });
    };
    
    /**
     * When an ID is available in the DTO the function attempts to retrieve the 
     * existing object.  If it is not available a new object is created.  The 
     * merge event is then called.  After the merge is complete the callback is 
     * executed with the merged object.
     * @private
     * @method _retrieveOnUpdateAndMerge
     * @param {Object} dto
     * @param {Function} cb
     */
    BaseObjectService.prototype._retrieveOnUpdateAndMerge = function(dto, cb) {
        
        //function used as callback handler so we can simplify if/else logic
        var self     = this;
        var id       = dto[pb.DAO.getIdField()];
        var isUpdate = id ? true : false;
        var isCreate = !isUpdate;
        var onObjectRetrieved = function(err, obj) {
            if (util.isError(err) || util.isNullOrUndefined(obj)) {
                return cb(err, obj);
            }
            
            var context = {
                service: self,
                data: dto,
                object: obj,
                isUpdate: isUpdate,
                isCreate: isCreate
            }
            events.emit(self.type + '.' + 'merge', context, function(err) {
                cb(err, obj);
            });
        };
        
        //when we are doing an update load the object
        if (id) {
            this.dao.loadById(id, this.type, onObjectRetrieved);
        }
        else {
            
            //we are creating a new object so pass it along
            onObjectRetrieved(null, {});
        }
    };
    
    BaseObjectService.prototype.deleteById = function(id, options, cb) {
        if (util.isFunction(options)) {
            cb      = options;
            options = {};
        }        
        options.where = pb.DAO.getIdWhere(id);
            
        this.deleteSingle(options, cb);
    };
    
    BaseObjectService.prototype.deleteSingle = function(options, cb) {
        if (util.isFunction(options)) {
            cb      = options;
            options = {};
        }

        var self = this;
        this.getSingle(options, function(err, obj) {
            if (util.isError(err) || util.isNullOrUndefined(obj)) {
                return cb(err, obj);
            }
            
            var context = {
                service: self,
                data: obj
            };
            events.emit(self.type + '.' + 'beforeDelete', context, function(err) {
                if (util.isError(err)) {
                    return cb(err, null);
                }
                
                self.dao.delete(options.where, self.type, options, function(err, result) {
                    if (util.isError(err)) {
                        return cb(err, obj);
                    }
                    
                    events.emit(self.type + '.' + 'afterDelete', context, function(err) {
                        cb(err, obj);
                    });
                });
            });
        });
    };
    
    /**
     * Creates a properly formed validation failure
     * @static
     * @method validationFailure
     * @param {String} field
     * @param {String} message
     * @param {String} [code]
     */
    BaseObjectService.validationFailure = function(field, message, code) {
        return {
            field: field || null,
            message: message || '',
            code: code || null
        };
    };
    
    /**
     * Inspects the raw set of validation results to ensure that plugins that 
     * don't follow proper procedure have their results excluded.
     * @static
     * @method consolidateValidationResults
     * @param {Array} results
     * @return {Array}
     */
    BaseObjectService.consolidateValidationResults = function(results) {
        if (!util.isArray(results)) {
            return null;
        }
        
        //filter out any malformed validation results from plugins
        var validationErrors = [];
        results.forEach(function(validationError) {
            if (!util.isObject(validationError)) {
                return;
            }
            validationErrors.push(validationError);
        });
        
        return validationErrors;
    };
    
    /**
     * Creates a new Error representative of a validation error
     * @static
     * @method validationError
     * @param {Array} validationFailures
     * @return {Error}
     */
    BaseObjectService.validationError = function(validationFailures) {
        var error = new Error('Validation Failure');
        error.code = 400;
        error.validationErrors = validationFailures;
        return error;
    };
    
    /**
     * Strips HTML formatting from a string value
     * @static
     * @method sanitize
     * @param {String} value
     * @param {Object} [config]
     */
    BaseObjectService.sanitize = function(value, config) {
        if (!value) {
            return value;
        }
        else if (!util.isObject(config)) {
            config = BaseObjectService.getDefaultSanitizationRules();
        }
        return Sanitizer(value, config);
    };
    
    /**
     * The sanitization rules that apply to Pages and Articles
     * @static
     * @method getContentSanitizationRules
     */
    BaseObjectService.getContentSanitizationRules = function() {
        return {
            allowedTags: [ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol', 'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div', 'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'img', 'u', 'span' ],
            allowedAttributes: {
                a: [ 'href', 'name', 'target', 'class', 'align'],
                img: [ 'src', 'class', 'align'],
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
                td: ['style', 'class', 'align'],
            },

            // Lots of these won't come up by default because we don't allow them
            selfClosing: [ 'img', 'br', 'hr', 'area', 'base', 'basefont', 'input', 'link', 'meta' ],

            // URL schemes we permit
            allowedSchemes: [ 'http', 'https', 'ftp', 'mailto' ]
        };
    };

    /**
     * @static
     * @method getDefaultSanitizationRules
     */
    BaseObjectService .getDefaultSanitizationRules = function() {
        return {
            allowedTags: [],
            allowedAttributes: {}
        };
    };
    
    BaseObjectService.getDate = function(dateStr) {
        var val = Date.parse(dateStr);
        return isNaN(val) ? null : new Date(val);
    };
    
    BaseObjectService.on = function(event, listener) {
        return events.on(event, listener);
    };
    
    BaseObjectService.once = function(event, listener) {
        return events.once(event, listener);
    };
    
    BaseObjectService.removeListener = function(event, listener) {
        return events.removeListener(event, listener);
    };
    
    BaseObjectService.removeAllListeners = function(event) {
        return events.removeAllListeners(event);
    };
    
    BaseObjectService.setMaxListeners = function(n) {
        return events.setMaxListeners(n);
    };
    
    BaseObjectService.listeners = function(event) {
        return events.listeners(event);
    };
    
    return BaseObjectService;
};