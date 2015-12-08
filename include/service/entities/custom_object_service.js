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
var util        = require('../../util.js');
var async       = require('async');
var HtmlEncoder = require('htmlencode');

module.exports = function CustomObjectServiceModule(pb) {

    /**
     * Provides a service to do the heavy lifting of retrieving custom objects with
     * the ability to eagerly fetch the related objects.
     * @class CustomObjectService
     * @constructor
     */
    function CustomObjectService(siteUid, onlyThisSite) {
        this.typesCache = {};
        this.typesNametoId = {};

        this.site = pb.SiteService.getCurrentSite(siteUid);
        this.siteQueryService = new pb.SiteQueryService({site: this.site, onlyThisSite: onlyThisSite});
    }

    //statics
    /**
     * @static
     * @property CUST_OBJ_COLL
     * @type {String}
     */
    CustomObjectService.CUST_OBJ_COLL = 'custom_object';

    /**
     * @static
     * @property CUST_OBJ_TYPE_COLL
     * @type {String}
     */
    CustomObjectService.CUST_OBJ_TYPE_COLL = 'custom_object_type';

    /**
     * @static
     * @property CUST_OBJ_SORT_COLL
     * @type {String}
     */
    CustomObjectService.CUST_OBJ_SORT_COLL = 'custom_object_sort';

    //constants
    /**
     *
     * @private
     * @static
     * @property NAME_FIELD
     * @type {String}
     */
    var NAME_FIELD = 'name';

    /**
     *
     * @private
     * @static
     * @property PEER_OBJECT_TYPE
     * @type {String}
     */
    var PEER_OBJECT_TYPE = 'peer_object';

    /**
     *
     * @private
     * @static
     * @property CHILD_OBJECTS_TYPE
     * @type {String}
     */
    var CHILD_OBJECTS_TYPE = 'child_objects';

    /**
     *
     * @private
     * @static
     * @property CUST_OBJ_TYPE_PREFIX
     * @type {String}
     */
    var CUST_OBJ_TYPE_PREFIX = 'custom:';

    /**
     *
     * @private
     * @static
     * @property AVAILABLE_FIELD_TYPES
     * @type {Object}
     */
    var AVAILABLE_FIELD_TYPES = Object.freeze({
        'text': pb.validation.isStr,
        'number': pb.validation.isNum,
        'wysiwyg': pb.validation.isStr,
        'boolean': pb.validation.isBool,
        'date': pb.validation.isDate,
        'peer_object': pb.validation.isIdStr,
        'child_objects': pb.validation.isArray
    });

    /**
     *
     * @private
     * @static
     * @property AVAILABLE_REFERENCE_TYPES
     * @type {Object}
     */
    var AVAILABLE_REFERENCE_TYPES = [
        'article',
        'page',
        'section',
        'topic',
        'media',
        'user'
    ];

    /**
     * Validates and persists a sort ordering for custom objects of a specific type
     * @method saveSortOrdering
     * @param {Object} sortOrder
     * @param {Function} cb
     */
    CustomObjectService.prototype.saveSortOrdering = function(sortOrder, cb) {
        if (!pb.validation.isObj(sortOrder, true)) {
            throw new Error('The custom object type must be a valid object.');
        }

        var self = this;
        sortOrder.object_type = CustomObjectService.CUST_OBJ_SORT_COLL;
        this.validateSortOrdering(sortOrder, function(err, errors) {
            if (util.isError(err) || errors.length > 0) {
                return cb(err, errors);
            }

            var dao = new pb.DAO();
            dao.save(sortOrder, cb);
        });
    };

    /**
     * Validates a sort ordering for custom objects of a specific type
     * @method validateSortOrdering
     * @param {Object} sortOrdering
     * @param {Function} cb A callback that takes two parameters. The first is an
     * error, if occurred and the second is an array of validation error objects.
     * If the array is empty them it is safe to assume that the object is valid.
     */
    CustomObjectService.prototype.validateSortOrdering = function(sortOrder, cb) {
        if (!util.isObject(sortOrder)) {
            throw new Error('The sortOrder parameter must be a valid object');
        }

        //validat sorted IDs
        var errors = [];
        if (!util.isArray(sortOrder.sorted_objects)) {
            errors.push(CustomObjectService.err('sorted_objects', 'The sorted_objects property must be an array of IDs'));
        }
        else {
            if (sortOrder.length === 0) {
                errors.push(CustomObjectService.err('sorted_objects', 'The sorted objects ID list cannot be empty'));
            }

            for (var i = 0; i < sortOrder.length; i++) {

                if (!pb.validation.isIdStr(sortOrder[i], true)) {
                    errors.push(CustomObjectService.err('sorted_objects.'+i, 'An invalid ID was found in the sorted_objects array at index '+i));
                }
            }
        }

        //validate that an object type Id is present
        if (!pb.validation.isIdStr(sortOrder.custom_object_type, true)) {
            errors.push(CustomObjectService.err('custom_object_type', 'An invalid ID value was passed for the custom_object_type property'));
        }

        //validate an object type exists
        if (sortOrder.object_type !== CustomObjectService.CUST_OBJ_SORT_COLL) {
            errors.push(CustomObjectService.err('object_type', 'The object_type value must be set to: '+CustomObjectService.CUST_OBJ_SORT_COLL));
        }

        cb(null, errors);
    };

    /**
     * Retrieves custom objects of the specified type based on the specified options.
     * @method findByTypeWithOrdering
     * @param {Object|String} The custom object type descriptor object or the ID
     * string of the type descriptor.
     * @param {Object} [options={}] The filters and other flags.  The options object
     * supports the same fields as the DAO.query function.
     * @param {Integer} [options.fetch_depth=0] The depth indicates how many levels
     * of referenced child and peer objects to load.  At the bottom level the
     * references will be left as ID strings.
     * @param {Function} cb A callback that takes two parameters. The first is any
     * error, if ocurred. The second is an array of objects sorted by the ordering
     * assigned for the custom object or by name if no ordering exists.
     */
    CustomObjectService.prototype.findByTypeWithOrdering = function(custObjType, options, cb) {
        if (util.isFunction(options)) {
            cb = options;
            options = {};
        }
        else if (!util.isObject(options)) {
            options = {};
        }

        var sortOrder   = null;
        var custObjects = null;
        var self        = this;
        var tasks       = [

            //load objects
            function(callback) {
                self.findByType(custObjType, options, function(err, custObjectDocs) {
                    custObjects = custObjectDocs;
                    callback(err);
                });
            },

            //load ordering
            function(callback) {
                self.loadSortOrdering(custObjType, function(err, ordering) {
                    sortOrder = ordering;
                    callback(err);
                });
            }
        ];
        async.parallel(tasks, function(err, results) {
            custObjects = CustomObjectService.applyOrder(custObjects, sortOrder);
            cb(err, custObjects);
        });
    };

    /**
     * Coordinates the eager fetching of peer and child objects for the specified custom object.
     * @method fetchChildren
     * @param {Object} custObj The custom object to inspect
     * @param {Object} options The options specified for the retrieval
     * @param {Integer} options.fetch_depth The number of levels of peer and child
     * objects to retrieve
     * @param {Object|String} custObjType The custom object type for the specified
     * custom object.  This can also be the ID string value.
     * @param {Function} cb A callback function that takes two parameters. The
     * first is an Error, if occurred. The second is the specified custom object.
     */
    CustomObjectService.prototype.fetchChildren = function(custObj, options, custObjType, cb) {
        if (!util.isObject(custObj) || !util.isObject(options)) {
            throw new Error('The custObj and options parameters must be an objects');
        }
        else if (util.isFunction(custObjType)) {
            cb          = custObjType;
            custObjType = null;
        }
        else if (!pb.validation.isInt(options.fetch_depth, true, true) || options.fetch_depth <= 0) {
            return cb(null, custObj);
        }

        //log what we are doing. this shit gets confusing
        if (pb.log.isSilly()) {
            pb.log.silly('CustomObjectService: Fetching children for [%s][%s] at depth:[%d]', custObj.type, custObj.name, options.fetch_depth);
        }

        //private function to retrieve the custom object type if not available
        var self           = this;
        var getCustObjType = function(type, cb) {
            if (util.isObject(type)) {
                return cb(null, type);
            }
            else if (self.typesCache[type]) {
                return cb(null, self.typesCache[type]);
            }
            else if (self.typesNametoId[type]) {
                return cb(null, self.typesCache[self.typesNametoId[type]]);
            }
            else if (!type) {
                type = custObj.type;
            }

            //build out the where clause
            var where = null;
            if (pb.validation.isIdStr(type, true)) {
                where = pb.DAO.getIdWhere(type);
            }
            else {
                where = {
                    name: type
                };
            }
            self.loadTypeBy(where, function(err, custObjType) {
                if (util.isObject(custObjType)) {
                    self.typesCache[type] = custObjType;
                    self.typesNametoId[custObjType.name] = custObjType[pb.DAO.getIdField()];
                }
                cb(err, custObjType);
            });
        };

        //loads up a peer object
        var loadPeerObject = function(id, objType, cb) {
            if (!pb.validation.isIdStr(id, true)) {
                return cb(null, null);
            }

            //we must determine if we are loading a regular object or a custom object
            if (CustomObjectService.isCustomObjectType(objType)) {
                getCustObjType(CustomObjectService.getCustTypeSimpleName(objType), function(err, type) {
                    if (util.isError(err)) {
                        return cb(err);
                    }
                    self.loadById(id, {fetch_depth: options.fetch_depth - 1}, cb);
                });
            }
            else {
                //we know that we are a system object so we resort to DAO
                var dao = new pb.DAO();
                dao.loadById(id, objType, cb);
            }
        };

        //load up child objects
        var loadChildObjects = function(ids, objType, cb) {
            if (!util.isArray(ids) || ids === []) {
                return cb(null, []);
            }

            //we must determine if we are loading custom objects or regular system objects
            if (CustomObjectService.isCustomObjectType(objType)) {
                getCustObjType(CustomObjectService.getCustTypeSimpleName(objType), function(err, type) {
                    if (util.isError(err)) {
                        return cb(err);
                    }

                    var opts = {
                        where: pb.DAO.getIdInWhere(ids),
                        fetch_depth: options.fetch_depth - 1
                    };
                    self.findByType(type, opts, cb);
                });
            }
            else {

                var opts = { where: pb.DAO.getIdInWhere(ids) };
                var dao  = new pb.DAO();
                dao.q(objType, opts, cb);
            }
        };

        //make sure we have the type for the object passed in
        getCustObjType(custObjType, function(err, custObjType) {
            if (util.isError(err)) {
               return cb(err);
            }
            else if (util.isNullOrUndefined(custObjType)) {
                return cb(new Error('An invalid custom object type: ' + custObjType + ' was found.'));
            }

            var tasks = util.getTasks(Object.keys(custObjType.fields), function(fieldNames, i) {
                return function(callback) {

                    var field = custObjType.fields[fieldNames[i]];
                    if (!CustomObjectService.isReferenceFieldType(field.field_type)) {
                        return callback();
                    }

                    //load a peer object
                    if (field.field_type === PEER_OBJECT_TYPE) {

                        //load and set the peer object
                        loadPeerObject(custObj[fieldNames[i]], field.object_type, function(err, peerObj) {
                            if (util.isObject(peerObj)) {
                                custObj[fieldNames[i]] = peerObj;
                            }
                            callback(err);
                        });
                    }//load child objects
                    else if (field.field_type === CHILD_OBJECTS_TYPE) {

                        //load and set the child objects
                        loadChildObjects(custObj[fieldNames[i]], field.object_type, function(err, childObjs) {
                             if (util.isArray(childObjs)) {

                                 //apply the original ordering to the fields.  The
                                 //DB does not promise to provide the correct ordering.
                                 var sortOrder = {
                                     sorted_objects: custObj[fieldNames[i]]
                                 };
                                 custObj[fieldNames[i]] = CustomObjectService.applyOrder(childObjs, sortOrder);
                             }
                            callback(err);
                        });
                    }
                    else {
                        callback(new Error('An invalid field type was provided: '+field.field_type));
                    }
                };
            });
            async.series(tasks, function(err, results) {
                cb(err, custObj);
            });
        });
    };

    /**
     * Loads an ordering object for a specific custom object type.
     * @method loadSortOrdering
     * @param {Object|String} custObjType
     * @param {Function} cb A callback that takes two parameters.  The first is an
     * error, if occurred.  The second is the sort ordering object if found.
     */
    CustomObjectService.prototype.loadSortOrdering = function(custObjType, cb) {
        if (util.isObject(custObjType)) {
            custObjType = custObjType[pb.DAO.getIdField()] + '';
        }
        else if (!util.isString(custObjType)) {
            throw new Error('An invalid custom object type was provided: '+(typeof custObjType)+':'+custObjType);
        }

        var dao = new pb.DAO();
        dao.loadByValue('custom_object_type', custObjType, CustomObjectService.CUST_OBJ_SORT_COLL, cb);
    };

    /**
     * Finds custom objects by the specified type.
     * @method findByType
     * @param {Object|String} type The custom object type object or the ID of the
     * object as a string
     * @param {Object} [options] See DAO.q()
     * @param {Function} cb A callback that takes two arguments. The first is an
     * error, if occurred.  The second is an array of custom objects that match the
     * specified criteria.
     */
    CustomObjectService.prototype.findByType = function(type, options, cb) {
        if (util.isFunction(options)) {
            cb = options;
            options = {};
        }
        else if (!util.isObject(options)) {
            options = {};
        }

        //ensure a where clause
        if (!util.isObject(options.where)) {
            options.where = {};
        }

        var typeStr = type;
        if (util.isObject(type)) {
            typeStr = type[pb.DAO.getIdField()] + '';
        }
        options.where.type = typeStr;

        var self = this;
        self.siteQueryService.q(CustomObjectService.CUST_OBJ_COLL, options, function(err, custObjs) {
            if (util.isArray(custObjs)) {

                var tasks = util.getTasks(custObjs, function(custObjs, i) {
                    return function(callback) {
                        self.fetchChildren(custObjs[i], options, type, callback);
                    };
                });
                async.series(tasks, cb);
                return;
            }
            cb(err, custObjs);
        });
    };

    /**
     * Retrieves all of the custom object types in the system
     * @method findTypes
     * @param {Function} cb A callback that takes two parameters. The first is an
     * error, if occurred.  The second is an array of custom object type objects.
     */
    CustomObjectService.prototype.findTypes = function(cb) {

        var opts = {
            where: pb.DAO.ANYWHERE,
            select: pb.DAO.PROJECT_ALL,
            order: {NAME_FIELD: pb.DAO.ASC}
        };

        this.siteQueryService.q(CustomObjectService.CUST_OBJ_TYPE_COLL, opts, function(err, custObjTypes) {
            if (util.isArray(custObjTypes)) {
                //currently, mongo cannot do case-insensitive sorts.  We do it manually
                //until a solution for https://jira.mongodb.org/browse/SERVER-90 is merged.
                custObjTypes.sort(function(a, b) {
                    var x = a.name.toLowerCase();
                    var y = b.name.toLowerCase();

                    return ((x < y) ? -1 : ((x > y) ? 1 : 0));
                });
            }
            cb(err, custObjTypes);
        });
    };

    /**
     * Retrieves a count based the specified criteria and type
     * @method countByType
     * @param {Object|String} type The custom object type object or ID string
     * @param {Object} [where] The criteria for which objects to count
     * @param {Function} cb A callback that takes two parameters. The first is an
     * error, if occurred. The second is the number of objects that match the
     * specified critieria.
     */
    CustomObjectService.prototype.countByType = function(type, where, cb) {
        if (util.isFunction(where)) {
            cb = where;
            where = {};
        }
        else if (!util.isObject(where)) {
            where = {};
        }

        var typeStr = type;
        if (util.isObject(type)) {
            typeStr = type[pb.DAO.getIdField()] + '';
        }
        where.type = typeStr;

        var dao = new pb.DAO();
        dao.count(CustomObjectService.CUST_OBJ_COLL, where, cb);
    };

    /**
     * Loads a custom object by ID
     * @method loadById
     * @param {ObjectID|String} id
     * @param {Object} [options]
     * @param {Function} cb
     */
    CustomObjectService.prototype.loadById = function(id, options, cb) {
        this.loadBy(undefined, pb.DAO.getIdWhere(id), options, cb);
    };

    /**
     * Loads a custom object by name
     * @method loadByName
     * @param {String} type The ID string of the custom object type
     * @param {String} name The unique name of the custom object
     * @param {Object} [options]
     * @param {Function} cb
     */
    CustomObjectService.prototype.loadByName = function(type, name, options, cb) {
        var where = {};
        where[NAME_FIELD] = name;
        this.loadBy(type, where, options, cb);
    };

    /**
     * Loads a custom object by the specified where criteria
     * @method loadBy
     * @param {String} type
     * @param {Object} where
     * @param {Object} [options]
     * @param {Function} cb
     */
    CustomObjectService.prototype.loadBy = function(type, where, options, cb) {
        if (!pb.validation.isIdStr(type, false) || !pb.validation.isObj(where, true) || pb.validation.isEmpty(where)) {
            throw new Error('The type, where must be provided in order to load a custom object');
        }
        else if (util.isFunction(options)) {
            cb      = options;
            options = {};
        }
        else if (!util.isObject(options)) {
            throw new Error('The options object must be an object');
        }

        if (type) {
            var typeStr = type;
            if (util.isObject(type)) {
                typeStr = type[pb.DAO.getIdField()] + '';
            }
    
            where.type = typeStr;
        }

        var self = this;
        self.siteQueryService.loadByValues(where, CustomObjectService.CUST_OBJ_COLL, function(err, custObj) {
            if (util.isObject(custObj)) {
                return self.fetchChildren(custObj, options, type, cb);
            }
            cb(err, custObj);
        });
    };

    /**
     * Loads a custom object type by ID
     * @method loadTypeById
     * @param {ObjectID|String} id
     * @param {Function} cb
     */
    CustomObjectService.prototype.loadTypeById = function(id, cb) {
        this.loadTypeBy(pb.DAO.getIdWhere(id), cb);
    };

    /**
     * Loads a custom object type by name
     * @method loadTypeByName
     * @param {String} name
     * @param {Function} cb
     */
    CustomObjectService.prototype.loadTypeByName = function(name, cb) {
        name      = CustomObjectService.getCustTypeSimpleName(name);
        var where = {};
        where[NAME_FIELD] = name;
        this.loadTypeBy(where, cb);
    };

    /**
     * Loads a custom object type by the specified where criteria
     * @method loadTypeBy
     * @param {Object} where
     * @param {Function} cb
     */
    CustomObjectService.prototype.loadTypeBy = function(where, cb) {
        if (!pb.validation.isObj(where, true) || pb.validation.isEmpty(where)) {
            return cb(Error("The where parameter must be provided in order to load a custom object type"));
        }

        this.siteQueryService.loadByValues(where, CustomObjectService.CUST_OBJ_TYPE_COLL, cb);
    };

    /**
     * Validates a custom object
     * @method validate
     * @param {Object} custObj The object to validate
     * @param {Object} custObjType The custom object type to validate against
     * @param {Function} cb A callback that takes two parameters. The first is an
     * error if occurred. The second is an array of validation error objects.  If
     * the array is empty it is safe to assume that the object is valid.
     */
    CustomObjectService.prototype.validate = function(custObj, custObjType, cb) {

        var self   = this;
        var errors = [];
        var dao    = new pb.DAO();
        var tasks  = [

            //validate object type
            function(callback) {
                if (custObj.object_type !== CustomObjectService.CUST_OBJ_COLL) {
                    errors.push(CustomObjectService.err('type', "The object type must be: "+custObj.object_type));
                }
                callback(null);
            },

            //validate the type
            function(callback) {
                if (!pb.validation.isIdStr(custObj.type) || custObj.type !== custObjType[pb.DAO.getIdField()].toString()) {
                    errors.push(CustomObjectService.err('type', "The type must be an ID string and must match the describing custom object type's ID"));
                }
                callback(null);
            },

            //validate the name
            function(callback) {
                if (!pb.validation.isNonEmptyStr(custObj.name, true)) {
                    errors.push(CustomObjectService.err('name', 'The name cannot be empty'));
                    return callback(null);
                }
                
                //test for HTML
                var sanitized = pb.BaseController.sanitize(custObj.name);
                if (sanitized !== custObj.name) {
                    errors.push(CustomObjectService.err('name', 'The name cannot contain HTML'));
                    return callback(null);
                }

                //test uniqueness of name
                var where = {
                    type: custObjType[pb.DAO.getIdField()].toString()
                };
                where[NAME_FIELD] = new RegExp('^'+util.escapeRegExp(custObj.name)+'$', 'i');
                dao.unique(CustomObjectService.CUST_OBJ_COLL, where, custObj[pb.DAO.getIdField()], function(err, isUnique){
                    if (!isUnique) {
                        errors.push(CustomObjectService.err('name', 'The name '+custObj.name+' is not unique'));
                    }
                    callback(err);
                });
            },

            //validate other fields
            function(callback) {
                self.validateCustObjFields(custObj, custObjType, function(err, fieldErrors) {
                    if (util.isArray(fieldErrors)) {
                        util.arrayPushAll(fieldErrors, errors);
                    }
                    callback(err);
                });
            }
        ];
        async.series(tasks, function(err, results) {
            cb(err, errors);
        });
    };

    /**
     * Validates the fields of a custom object
     * @method validateCustObjFields
     * @param {Object} custObj The object to validate
     * @param {Object} custObjType The custom object type to validate against
     * @param {Function} cb A callback that takes two parameters. The first is an
     * error if occurred. The second is an array of validation error objects.  If
     * the array is empty it is safe to assume that the object is valid.
     */
    CustomObjectService.prototype.validateCustObjFields = function(custObj, custObjType, cb) {

        var errors = [];
        var tasks = util.getTasks(Object.keys(custObjType.fields), function(keys, i) {
            return function(callback) {

                //check for excption
                var fieldName = keys[i];
                if (fieldName === NAME_FIELD) {
                    //validated independently in main validation function
                    return callback(null);
                }

                //get value
                var val = custObj[fieldName];

                //execute validation procedure
                var field          = custObjType.fields[fieldName];
                var fieldType      = field.field_type;
                var isValid        = AVAILABLE_FIELD_TYPES[fieldType];
                if (!isValid(val, false)) {
                    errors.push(CustomObjectService.err(fieldName, 'An invalid value ['+val+'] was found.'));
                }
                callback(null);
            };
        });
        async.series(tasks, function(err, results) {
            cb(err, errors);
        });
    };

    /**
     * Validates a Custom Object Type.
     * @method validateType
     * @param {Object} custObjType The object to validate
     * @param {Function} cb A callback function that provides two parameters: The
     * first, an error, if exists. The second is an array of objects that represent
     * validation errors.  If the 2nd parameter is an empty array it is safe to
     * assume that validation passed.
     */
    CustomObjectService.prototype.validateType = function(custObjType, cb) {
        if (!pb.validation.isObj(custObjType)) {
            return cb(new Error('The type descriptor must be an object: '+(typeof custObjType)));
        }

        var self   = this;
        var errors = [];
        var tasks  = [

            //validate the name
            function(callback) {
                if (!pb.validation.isNonEmptyStr(custObjType.name, true)) {
                    errors.push(CustomObjectService.err('name', 'The name cannot be empty'));
                    return callback(null);
                }

                //test for HTML
                var sanitized = pb.BaseController.sanitize(custObjType.name);
                if (sanitized !== custObjType.name) {
                    errors.push(CustomObjectService.err('name', 'The name cannot contain HTML'));
                    return callback(null);
                }

                //test uniqueness of name
                var where = {};
                where[NAME_FIELD] = new RegExp('^'+util.escapeRegExp(custObjType.name)+'$', 'i');
                self.siteQueryService.unique(CustomObjectService.CUST_OBJ_TYPE_COLL, where, custObjType[pb.DAO.getIdField()], function(err, isUnique){
                    if(!isUnique) {
                        errors.push(CustomObjectService.err('name', 'The name '+custObjType.name+' is not unique'));
                    }
                    callback(err);
                });
            },

            //validate the fields
            function(callback) {

                if (!pb.validation.isObj(custObjType.fields)) {
                    errors.push(CustomObjectService.err('fields', 'The fields property must be an object'));
                    return callback(null);
                }

                //get the supported object types
                self.getReferenceTypes(function(err, types) {
                    if (util.isError(err)) {
                        return callback(err);
                    }

                    var typesHash = util.arrayToHash(types);
                    for (var fieldName in custObjType.fields) {
                        if (!pb.validation.isNonEmptyStr(fieldName)) {
                            errors.push(CustomObjectService.err('fields.', 'The field name cannot be empty'));
                        }
                        else {
                            var fieldErrors = self.validateFieldDescriptor(custObjType.fields[fieldName], typesHash);
                            util.arrayPushAll(fieldErrors, errors);
                        }
                    }
                    callback(null);
                });
            }
        ];
        async.series(tasks, function(err, results) {
            cb(err, errors);
        });
    };

    /**
     * Validates that the field descriptor for a custom object type.
     * @method validateFieldDescriptor
     * @param {String} field
     * @param {Array} customTypes
     * @return {Array} An array of objects that contain two properties: field and
     * error
     */
    CustomObjectService.prototype.validateFieldDescriptor = function(field, customTypes) {
        var errors = [];
        if (!pb.validation.isObj(field)) {
            errors.push(CustomObjectService.err('', 'The field descriptor must be an object: '+(typeof field)));
        }
        else {

            if (!AVAILABLE_FIELD_TYPES[field.field_type]) {
                errors.push(CustomObjectService.err('field_type', 'An invalid field type was specified: '+field.field_type));
            }
            else if (field.field_type === PEER_OBJECT_TYPE || field.field_type === CHILD_OBJECTS_TYPE) {
                if (!customTypes[field.object_type]) {
                    errors.push(CustomObjectService.err('object_type', 'An invalid object type was specified: '+field.object_type));
                }
            }
        }
        return errors;
    };

    /**
     * Retrieves an array of all of the available object types that can be
     * referenced as a child or peer object.
     * @method getReferenceTypes
     * @param {Function} cb A callback that takes two parameters: The first, an
     * error, if occurs.  The second is an array of all of the available object
     * types that can be referenced as a peer or child object.
     */
    CustomObjectService.prototype.getReferenceTypes = function(cb) {

        var select                  = {};
        select[NAME_FIELD]          = 1;
        select[pb.DAO.getIdField()] = 0;

        var opts = {
            where: pb.DAO.ANYWHERE,
            select: select
        };

        this.siteQueryService.q(CustomObjectService.CUST_OBJ_TYPE_COLL, opts, function(err, types) {
            if (util.isError(err)) {
                return cb(err);
            }

            var allTypes = util.clone(AVAILABLE_REFERENCE_TYPES);
            for (var i = 0; i < types.length; i++) {
                allTypes.push('custom:'+types[i][NAME_FIELD]);
            }
            cb(null, allTypes);
        });
    };

    /**
     * Validates and persists a custom object
     * @method save
     * @param {Object} custObj The object to validate
     * @param {Object} custObjType The custom object type to validate against
     * @param {Function} cb A callback that takes two parameters. The first is an
     * error if occurred. The second is an array of validation error objects or the
     * result of the persistence operation.
     *
     */
    CustomObjectService.prototype.save = function(custObj, custObjType, cb) {
        if (!pb.validation.isObj(custObj, true)) {
            throw new Error('The custom object must be a valid object.');
        }

        var self = this;
        custObj.object_type = CustomObjectService.CUST_OBJ_COLL;
        this.validate(custObj, custObjType, function(err, errors) {
            if (util.isError(err) || errors.length > 0) {
                return cb(err, errors);
            }

            var dao = new pb.DAO();
            self.siteQueryService.save(custObj, cb);
        });
    };

    /**
     * Validates and persists a custom object type
     * @method saveType
     * @param {Object} custObjType The object to persist
     * @param {Function} cb A callback that takes two parameters. The first is an
     * error if occurred. The second is an array of validation error objects or the
     * result of the persistence operation.
     */
    CustomObjectService.prototype.saveType = function(custObjType, cb) {
        if (!pb.validation.isObj(custObjType, true)) {
            throw new Error('The custom object type must be a valid object.');
        }

        var self = this;
        custObjType.object_type = CustomObjectService.CUST_OBJ_TYPE_COLL;
        this.validateType(custObjType, function(err, errors) {
            if(util.isError(err) || errors.length > 0) {
                return cb(err, errors);
            }

            self.siteQueryService.save(custObjType, cb);
        });
    };

    /**
     * Deletes a custom object by ID
     * @method deleteById
     * @param {String} id
     * @param {Function} cb
     */
    CustomObjectService.prototype.deleteById = function(id, cb) {
        var dao = new pb.DAO();
        dao.deleteById(id, CustomObjectService.CUST_OBJ_COLL, cb);
    };

    /**
     * Deletes a custom object type by id
     * @method deleteTypeById
     * @param {String|ObjectID} id
     * @param {Object} [options={}]
     * @param {Function} cb
     */
    CustomObjectService.prototype.deleteTypeById = function(id, options, cb) {
        if (util.isFunction(options)) {
            cb = options;
            options = {};
        }

        if (!pb.validation.isId(id, true)) {
            return cb(new Error('INVALID_UID'));
        }

        var self  = this;
        var tasks = [

            //remove object type
            function(callback) {
                var dao = new pb.DAO();
                dao.deleteById(id, CustomObjectService.CUST_OBJ_TYPE_COLL, callback);
            },

            //remove those objects associated with the type
            function(callback) {
                self.deleteForType(id, callback);
            }
        ];
        async.series(tasks, cb);
    };

    /**
     * Deletes all custom objects of a specified type
     * @method deleteForType
     * @param {String|Object} custObjType A string ID of the custom object type or 
     * the custom object type itself.
     * @param {Object} [options={}]
     * @param {Function} cb
     */
    CustomObjectService.prototype.deleteForType = function(custObjType, cb) {

        var typeId = custObjType;
        if (!util.isString(custObjType)) {
            typeId = custObjType.toString();
        }
        var dao = new pb.DAO();
        dao.delete({type: typeId}, CustomObjectService.CUST_OBJ_COLL, cb);
    };

    CustomObjectService.prototype.typeExists = function(typeName, cb) {

        var where = {
            name: new RegExp('^'+util.escapeRegExp(typeName)+'$', 'ig')
        };

        this.siteQueryService.exists(CustomObjectService.CUST_OBJ_TYPE_COLL, where, cb);
    };

    /**
     * Retrieves the objects types that can be referenced by custom objects
     * @static
     * @method getStaticReferenceTypes
     * @return {Array}
     */
    CustomObjectService.getStaticReferenceTypes = function() {
        return util.clone(AVAILABLE_REFERENCE_TYPES);
    };

    /**
     * Determines if a field type is reference to another object type
     * @static
     * @method isReferenceFieldType
     * @param {String} fieldType
     * @return {Boolean}
     */
    CustomObjectService.isReferenceFieldType = function(fieldType) {
        return fieldType === PEER_OBJECT_TYPE || fieldType === CHILD_OBJECTS_TYPE;
    };

    /**
     * Determines if the field type is a custom object type or a system reference
     * @static
     * @method isCustomObjectType
     * @param {String} objType
     * @return {Boolean}
     */
    CustomObjectService.isCustomObjectType = function(objType) {
        return util.isString(objType) && objType.indexOf(CUST_OBJ_TYPE_PREFIX) === 0;
    };

    /**
     * Gets the simple custom object name.  The simple name is one that is not
     * prefixed to indicate that it is custom
     * @static
     * @method getCustTypeSimpleName
     * @param {String} name
     * @return {String}
     */
    CustomObjectService.getCustTypeSimpleName = function(name) {
        if (util.isString(name)) {
            name = name.replace(CUST_OBJ_TYPE_PREFIX, '');
        }
        return name;
    };

    /**
     * Formats the object by ensuring that each field is in the correct data type.
     * @static
     * @method formatRawForType
     * @param {Object} post The raw post object
     * @param {Object} custObjType The custom object type describes the data in the
     * post obj.
     */
    CustomObjectService.formatRawForType = function(post, custObjType) {

        //remove system fields if posted back
        delete post[pb.DAO.getIdField()];
        delete post.created;
        delete post.last_modified;

        //apply types to fields
        for(var key in custObjType.fields) {

            if(custObjType.fields[key].field_type == 'number') {
                if(util.isString(post[key])) {
                    post[key] = parseFloat(post[key]);
                }
            }
            else if(custObjType.fields[key].field_type == 'date') {
                if(util.isString(post[key])) {
                    post[key] = Date.parse(post[key]);
                }
                else if (!isNaN(post[key])) {
                    post[key] = new Date(post[key]);
                }
            }
            else if (custObjType.fields[key].field_type == 'boolean') {
                if (!util.isBoolean(post[key])) {

                    if (util.isString(post[key])) {
                        post[key] = "true" === post[key].toLowerCase();   
                    }
                    else if (!isNaN(post[key])) {
                        post[key] = post[key] ? true : false;
                    }
                }
            }
            else if (custObjType.fields[key].field_type == 'wysiwyg') {

                //ensure not funky script tags or iframes
                post[key] = pb.BaseController.sanitize(post[key], pb.BaseController.getContentSanitizationRules());
            }
            else if(custObjType.fields[key].field_type == CHILD_OBJECTS_TYPE) {
                if(util.isString(post[key])) {

                    //strips out any non ID strings.  
                    //TODO This should really move to validation.
                    post[key] = post[key].split(',');
                    for (var i = post[key].length - 1; i >= 0; i--) {
                        if (!pb.validation.isIdStr(post[key][i], true)) {
                            post[key].splice(i, 1);
                        }
                    }
                }
            }
            else if (custObjType.fields[key].field_type == PEER_OBJECT_TYPE) {
                //do nothing because it can only been a string ID.  Validation 
                //should verify this before persistence. 
            }
            else if (util.isString(post[key])){

                //when nothing else matches and we just have a string. We should sanitize it
                post[key] = pb.BaseController.sanitize(post[key]);
            }
        }
        post.type = custObjType[pb.DAO.getIdField()].toString();
    };

    /**
     * Formats the raw post data for a sort ordering
     * @static 
     * @method formatRawSortOrdering
     * @param {Object} post
     * @param {Object} sortOrder the existing sort order object that the post data 
     * will be merged with
     * @return {Object} The formatted sort ordering object
     */
    CustomObjectService.formatRawSortOrdering = function(post, sortOrder) {
        delete post.last_modified;
        delete post.created;
        delete post[pb.DAO.getIdField()];

        var sortOrderDoc = pb.DocumentCreator.create('custom_object_sort', post, []);
        if (!sortOrderDoc) {
            return sortOrderDoc;
        }

        //merge the old and new
        if (util.isObject(sortOrder)) {
            util.merge(sortOrderDoc, sortOrder);
            return sortOrder;
        }
        return sortOrderDoc;
    };

    /**
     * Discovers the field types used for each entry in the provided array and sets
     * the "fieldTypesUsed" property for the object.
     * @static
     * @method setFieldTypesUsed
     * @param {Array} custObjTypes The array of custom object type objects to inspect
     * @param {Localization} ls
     */
    CustomObjectService.setFieldTypesUsed = function(custObjTypes, ls) {
        if (!util.isArray(custObjTypes)) {
            return;
        }

        var map                 = {};
        map.text                = ls.get('TEXT');
        map.number              = ls.get('NUMBER');
        map.wysiwyg             = ls.get('WYSIWYG');
        map.boolean             = ls.get('BOOLEAN').toLowerCase();
        map.date                = ls.get('DATE');
        map[PEER_OBJECT_TYPE]   = ls.get('PEER_OBJECT');
        map[CHILD_OBJECTS_TYPE] = ls.get('CHILD_OBJECTS');

        // Make the list of field types used in each custom object type, for display
        for(var i = 0; i < custObjTypes.length; i++) {

            var fieldTypesUsed = {};
            for(var key in custObjTypes[i].fields) {

                var fieldType = custObjTypes[i].fields[key].field_type;
                fieldTypesUsed[map[fieldType]] = 1;
            }

            fieldTypesUsed = Object.keys(fieldTypesUsed);
            custObjTypes[i].fieldTypesUsed = fieldTypesUsed.join(', ');
        }
    };

    /**
     * Orders the custom objects based on the provided sort order
     * @static
     * @method applyOrder
     * @param {Array} custObjects The array of custom objects to be sorted
     * @param {Object} sortOrder The object describing the ordering of the objects
     * @return {Array} A refernce to the sorted array of custom objects.  The
     * reference is the same as provided to the function.
     */
    CustomObjectService.applyOrder = function(custObjects, sortOrder) {
        if (!util.isArray(custObjects)) {
            throw new Error('The custObjects parameter must be an array');
        }

        //sort by name (case-insensitive)
        if(!util.isObject(sortOrder) || !sortOrder.sorted_objects) {
            //currently, mongo cannot do case-insensitive sorts.  We do it manually
            //until a solution for https://jira.mongodb.org/browse/SERVER-90 is merged.
            custObjects.sort(function(a, b) {
                var x = a.name.toLowerCase();
                var y = b.name.toLowerCase();

                return ((x < y) ? -1 : ((x > y) ? 1 : 0));
            });
        }
        else {
            var idField          = pb.DAO.getIdField();
            var customObjectSort = sortOrder.sorted_objects;
            var sortedObjects    = [];
            for(var i = 0; i < customObjectSort.length; i++) {
                for(var j = 0; j < custObjects.length; j++) {
                    if(custObjects[j][idField].equals(pb.DAO.getObjectId(customObjectSort[i]))) {
                        sortedObjects.push(custObjects[j]);
                        custObjects.splice(j, 1);
                        break;
                    }
                }
            }

            custObjects = sortedObjects.concat(custObjects);
        }
        return custObjects;
    };

    /**
     * Creates a validation error field
     * @static
     * @method err
     * @param {String} field The field in the object that contains the error
     * @param {String} err A string description of the error
     * @return {Object} An object that describes the validation error
     */
    CustomObjectService.err = function(field, err) {
        return {
            field: field,
            msg: err
        };
    };

    /**
     * Creates an HTML formatted error string out of an array of error objects.
     * @static
     * @method createErrorStr
     * @param {Array} errors An array of objects where each object has a "msg" and
     * a "field" property
     * @param {String} msg
     * @return {String} HTML formatted string representing the errors
     */
    CustomObjectService.createErrorStr = function(errors, msg) {
        var errStr = '';
        if (msg) {
            errStr += msg + '\n';
        }

        errStr += '<ul>';
        for(var i = 0; i < errors.length; i++) {
            var err = errors[i];

            errStr += '<li>';
            if (err.field) {
                errStr += err.field + ': ';
            }
            errStr += HtmlEncoder.htmlEncode(err.msg) + '</li>';
        }
        errStr += '</ul>';
        return errStr;
    };

    return CustomObjectService;
};
