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
var AsyncEventEmitter = require('async-eventemitter');

module.exports = function(pb) {
    
    //pb Dependencies
    var events = new AsyncEventEmitter();
    
    /**
     *
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
         *
         * @property type
         * @type {String}
         */
        this.type = context.type;
        
        /**
         *
         * @property dao
         * @type {DAO}
         */
        this.dao = new pb.DAO();
    }
    
    var MAX_RESULTS = 250;
    
    BaseObjectService.GET_ALL = "getAll";
    
    BaseObjectService.GET = "get";
    
    BaseObjectService.FORMAT = "format";
    
    BaseObjectService.MERGE = "merge";
    
    BaseObjectService.VALIDATE = "validate";
    
    BaseObjectService.BEFORE_SAVE = "beforeSave";
    
    BaseObjectService.AFTER_SAVE = "afterSave";
    
    BaseObjectService.BEFORE_DELETE = "beforeDelete";
    
    BaseObjectService.AFTER_DELETE = "afterDelete";
    
    BaseObjectService.prototype.getAll = function(options, cb) {
        if (util.isFunction(options)) {
            cb      = options;
            options = {};
        }
        
        var self = this;
        var opts = {
            select: options.select,
            where: options.where,
            order: options.order,
            limit: Math.min(options.limit, MAX_RESULTS),
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
    
    BaseObjectService.prototype.count = function(options, cb) {
        if (util.isFunction(options)) {
            cb      = options;
            options = {};
        }
        
        this.dao.count(this.type, options.where, cb);
    };
    
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
    
    BaseObjectService.validationFailure = function(field, message, code) {
        return {
            field: field || null,
            message: message || '',
            code: code || null
        };
    };
    
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
    
    BaseObjectService.validationError = function(validationFailures) {
        var error = new Error('Validation Failure');
        error.code = 400;
        error.validationErrors = validationFailures;
        return error;
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