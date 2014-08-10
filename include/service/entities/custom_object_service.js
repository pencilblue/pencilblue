/*
    Copyright (C) 2014  PencilBlue, LLC

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

/**
 *
 * @class CustomObjectService
 * @constructor
 */
function CustomObjectService() {}

//statics
CustomObjectService.CUST_OBJ_COLL = 'custom_object';
CustomObjectService.CUST_OBJ_TYPE_COLL = 'custom_object_type';

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
 * @property AVAILABLE_FIELD_TYPES
 * @type {Object}
 */
var AVAILABLE_FIELD_TYPES = {
    'text': pb.validation.isStr,
    'number': pb.validation.isNum,
    'date': pb.validation.isDate,
    PEER_OBJECT_TYPE: pb.validation.isIdStr,
    CHILD_OBJECTS_TYPE: pb.validation.isArray
};

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

CustomObjectService.prototype.loadById = function(type, id, cb) {
    this.loadBy(type, pb.DAO.getIdWhere(id), cb);
};

CustomObjectService.prototype.loadByName = function(type, name, cb) {

    var where = {};
    where[NAME_FIELD] = name;
    this.loadBy(type, where, cb);
};

CustomObjectService.prototype.loadBy = function(type, where, cb) {
    if (!pb.valiation.isIdStr(type, true) || !pb.validation.isObj(where, true) || pb.validation.isEmpty(where)) {
        throw new Error('The type, where must be provided in order to load a custom object');
    }

    where.type = type;
    var dao = new pb.DAO();
    dao.loadBy(CustomObjectService.CUST_OBJ_COLL, where, cb);
};

CustomObjectService.prototype.loadTypeById = function(id, cb) {
    this.loadTypeBy(type, pb.DAO.getIdWhere(id), cb);
};

CustomObjectService.prototype.loadTypeByName = function(type, name, cb) {

    var where = {};
    where[NAME_FIELD] = name;
    this.loadTypeBy(type, where, cb);
};

CustomObjectService.prototype.loadTypeBy = function(where, cb) {
    if (!pb.valiation.isIdStr(type, true) || !pb.validation.isObj(where, true) || pb.validation.isEmpty(where)) {
        throw new Error('The type, where must be provided in order to load a custom object type');
    }

    var dao = new pb.DAO();
    dao.loadBy(CustomObjectService.CUST_OBJ_TYPE_COLL, where, cb);
};

CustomObjectService.prototype.validate = function(custObj, custObjType, options, cb) {
    cb(null, []);//TODO start here
};

CustomObjectService.prototype.validateType = function(custObjType, cb) {
    if (!pb.validation.isObj(custObjType)) {
        return cb(new Error('The type descriptor must be an object: '+(typeof custObjType)));
    }

    var self   = this;
    var errors = [];
    var dao    = new pb.DAO();
    var tasks  = [

        //validate the name
        function(callback) {
            if (!pb.validation.isNonEmptyStr(custObjType.name)) {
                errors.push(CustomObjectService.err('name', 'The name cannot be empty'));
                return callback(null);
            }

            //test uniqueness of name
            var where = {NAME_FIELD: custObjType.name};
            dao.unique(CustomObjectService.CUST_OBJ_TYPE_COLL, where, custObjType[pb.DAO.getIdField()], function(err, isUnique){
                if (!isUnique) {
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

                var typesHash = pb.utils.arrayToHash(types);
                for (var fieldName in custObjType.fields) {
                    if (!pb.validation.isNonEmptyStr(fieldName)) {
                        errors.push(CustomObjectService.err('fields.', 'The field name cannot be empty'));
                    }
                    else {
                        var fieldErrors = self.validateFieldDescriptor(custObjType.fields[fieldName], typesHash);
                        pb.utils.arrayPushAll(fieldErrors, errors);
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

CustomObjectService.prototype.getReferenceTypes = function(cb) {

    var select = {
        NAME_FIELD: 1
    };
    select[pb.DAO.getIdField()] = 0;
    var dao = new pb.DAO();
    dao.query(CustomObjectService.CUST_OBJ_TYPE_COLL, {}, select).then(function(types) {
        if (util.isError(types)) {
            return cb(result);
        }

        var allTypes = pb.utils.clone(AVAILABLE_REFERENCE_TYPES);
        for (var i = 0; i < types.length; i++) {
            allTypes.push('custom:'+types[i][NAME_FIELD]);
        }
        cb(null, types);
    });
};

CustomObjectService.err = function(field, err) {
    return {
        field: field,
        error: err
    };
};

//exports
module.exports = CustomObjectService;
