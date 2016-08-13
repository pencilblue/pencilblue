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

module.exports = function(pb) {

    //pb dependencies
    var util              = pb.util;
    var BaseObjectService = pb.BaseObjectService;

    /**
     * BookService - An example of a service that leverages the
     * BaseObjectService to perform the heavy lifting for CRUD operations.
     * @class BookService
     * @constructor
     * @extends BaseObjectService
     */
    function BookService(context) {
        if (!util.isObject(context)) {
            context = {};
        }

        context.type = TYPE;
        BookService.super_.call(this, context);
    }
    util.inherits(BookService, BaseObjectService);

    /**
     * The name of the DB collection where the resources are persisted
     * @private
     * @static
     * @readonly
     * @property TYPE
     * @type {String}
     */
    var TYPE = 'book';

    /**
     * The name the service
     * @private
     * @static
     * @readonly
     * @property SERVICE_NAME
     * @type {String}
     */
    var SERVICE_NAME = 'BookService';

    /**
     * Responsible for taking the raw incoming object from the request and
     * formatting each property as it should be for persistence.
     * @static
     * @method format
     * @param {Object} context
     * @param {Object} context.data The DTO that was provided for persistence
     * @param {BookService} context.service An instance of the service that triggered
     * the event that called this handler
     * @param {Function} cb A callback that takes a single parameter: an error if occurred
     */
    BookService.format = function(context, cb) {
        var dto = context.data;
        dto.name = BaseObjectService.sanitize(dto.name);
        dto.author = BaseObjectService.sanitize(dto.author);
        dto.description = BaseObjectService.sanitize(dto.name);
        dto.publishDate = BaseObjectService.getDate(dto.publishDate);

        cb(null);
    };

    /**
     * Merges the incoming DTO with the existing or new object that will be persisted
     * @static
     * @method merge
     * @param {Object} context
     * @param {Boolean} context.isCreate Indicates if this is a creation operation
     * @param {Boolean} context.isUpdate Indicates if the this is an update operation
     * @param {Object} context.data The DTO that was provided for persistence
     * @param {Object} context.object The object that will actually be persisted.  On
     * Updates this is the resource that was retrieved from the DB
     * @param {BookService} context.service An instance of the service that
     * triggered the event that called this handler
     * @param {Function} cb A callback that takes a single parameter: an error if occurred
     */
    BookService.merge = function(context, cb) {
        context.object.name        = context.data.name;
        context.object.author      = context.data.author;
        context.object.description = context.data.description;
        context.object.publishDate = context.data.publishDate;

        //You might also want to add properties to the object only on certain conditions
        if (context.isCreate) {
            context.object.superSecretId = util.uniqueId();
        }

        cb(null);
    };

    /**
     * Validates the object.  Any errors should be pushed to the
     * context.validationErrors property so that a 400 response can be
     * generated.
     * @static
     * @method validate
     * @param {Object} context
     * @param {Boolean} context.isCreate Indicates if this is a creation operation
     * @param {Boolean} context.isUpdate Indicates if the this is an update operation
     * @param {Object} context.data The object that is to be validated before persistence
     * @param {Array} context.validationErrors The array that can be added to in
     * order to supply your own validation errors
     * @param {BookService} context.service An instance of the service that triggered
     * the event that called this handler
     * @param {Function} cb A callback that takes a single parameter: an error if occurred
     */
    BookService.validate = function(context, cb) {
        var obj    = context.data;
        var errors = context.validationErrors;

        if (!pb.ValidationService.isNonEmptyStr(obj.name, true)) {
            errors.push(BaseObjectService.validationFailure('name', 'Name is required'));
        }

        if (!pb.ValidationService.isNonEmptyStr(obj.description, true)) {
            errors.push(BaseObjectService.validationFailure('description', 'Description is required'));
        }

        if (!pb.ValidationService.isNonEmptyStr(obj.author, true)) {
            errors.push(BaseObjectService.validationFailure('author', 'Author is required'));
        }

        if (!pb.ValidationService.isDate(obj.publishDate, true)) {
            errors.push(BaseObjectService.validationFailure('publishDate', 'Publish Date is required'));
        }

        cb(null);
    };

    /**
     * Provides a mechanism to inspect the results of a query against the
     * collection.  Each object can be modified before it is passed back to the
     * calling entity.
     * @static
     * @method onGetAll
     * @param {Object} context
     * @param {Array} context.data The array of objects from the query
     * @param {BookService} context.service An instance of the service that triggered
     * the event that called this handler
     * @param {Function} cb A callback that takes a single parameter: an error if occurred
     */
    BookService.onGetAll = function(context, cb) {
        var queryResults = context.data;
        queryResults.forEach(function(book) {

            //remove the super secret id before we pass it back out of the
            //service layer
            delete book.superSecretId;
        });

        cb(null);
    };

    /**
     * Provides a mechanism to inspect an object before it is passed back to the
     * entity that requested its retrieval.
     * @static
     * @method onGet
     * @param {Object} context
     * @param {Object} context.data The object that was retrieved from the persistence layer
     * @param {BookService} context.service An instance of the service that triggered
     * the event that called this handler
     * @param {Function} cb A callback that takes a single parameter: an error if occurred
     */
    BookService.onGet = function(context, cb) {

        //remove the super secret id before we pass it back out of the
        //service layer
        delete context.data.superSecretId;

        cb(null);
    };

    /**
     * Provides a mechanism to inspect an object just before it is persisted
     * @static
     * @method beforeSave
     * @param {Object} context
     * @param {Boolean} context.isCreate Indicates if this is a creation operation
     * @param {Boolean} context.isUpdate Indicates if the this is an update operation
     * @param {Object} context.data The object that is to be validated before persistence
     * @param {Array} context.validationErrors The array that can be added to in
     * order to supply your own validation errors
     * @param {BookService} context.service An instance of the service that triggered
     * the event that called this handler
     * @param {Function} cb A callback that takes a single parameter: an error if occurred
     */
    BookService.beforeSave = function(context, cb) {
        /* No-op */

        cb(null);
    };

    /**
     * Provides a mechanism to inspect an object just after it is persited
     * @static
     * @method afterSave
     * @param {Object} context
     * @param {Boolean} context.isCreate Indicates if this is a creation operation
     * @param {Boolean} context.isUpdate Indicates if the this is an update operation
     * @param {Object} context.data The object that is to be validated before persistence
     * @param {Array} context.validationErrors The array that can be added to in
     * order to supply your own validation errors
     * @param {BookService} context.service An instance of the service that triggered
     * the event that called this handler
     * @param {Function} cb A callback that takes a single parameter: an error if occurred
     */
    BookService.afterSave = function(context, cb) {

        //remove the super secret id before we pass it back out of the
        //service layer
        delete context.data.superSecretId;

        cb(null);
    };

    /**
     * Provides a mechanism to inspect an object before it is deleted
     * @static
     * @method beforeDelete
     * @param {Object} context
     * @param {Object} context.data The object that is to be deleted
     * @param {BookService} context.service An instance of the service that triggered
     * the event that called this handler
     * @param {Function} cb A callback that takes a single parameter: an error if occurred
     */
    BookService.beforeDelete = function(context, cb) {
        /* Perform any special validations to ensure it can be deleted */

        cb(null);
    };

    /**
     * Provides a mechansim to inspect an object just after it has been deleted
     * @static
     * @method afterDelete
     * @param {Object} context
     * @param {Object} context.data The object that is to be deleted
     * @param {BookService} context.service An instance of the service that triggered
     * the event that called this handler
     * @param {Function} cb A callback that takes a single parameter: an error if occurred
     */
    BookService.afterDelete = function(context, cb) {
        /* Do any cleanup of related objects since the object is now deleted */

        cb(null);
    };

    /**
     * This function is called when the service is being setup by the system.  It is
     * responsible for any setup that is needed when first created.  The services
     * are all instantiated at once and are not added to the platform untill all
     * initialization is complete.  Relying on other plugin services in the
     * initialization could result in failure.
     *
     * @static
     * @method init
     * @param {Function} cb A callback that should provide one argument: cb(error) or cb(null)
     * if initialization proceeded successfully.
     */
    BookService.init = function(cb) {
        pb.log.debug("BookService: Initialized");
        cb(null, true);
    };

    /**
     * A service interface function designed to allow developers to name the handle
     * to the service object what ever they desire. The function must return a
     * valid string and must not conflict with the names of other services for the
     * plugin that the service is associated with.
     *
     * @static
     * @method getName
     * @return {String} The service name
     */
    BookService.getName = function() {
        return SERVICE_NAME;
    };

    //Event Registries - Sets the handlers as the call backs when events are triggered for the given collection
    BaseObjectService.on(TYPE + '.' + BaseObjectService.FORMAT, BookService.format);
    BaseObjectService.on(TYPE + '.' + BaseObjectService.MERGE, BookService.merge);
    BaseObjectService.on(TYPE + '.' + BaseObjectService.VALIDATE, BookService.validate);
    BaseObjectService.on(TYPE + '.' + BaseObjectService.GET, BookService.onGet);
    BaseObjectService.on(TYPE + '.' + BaseObjectService.GET_ALL, BookService.onGetAll);
    BaseObjectService.on(TYPE + '.' + BaseObjectService.BEFORE_SAVE, BookService.beforeSave);
    BaseObjectService.on(TYPE + '.' + BaseObjectService.AFTER_SAVE, BookService.afterSave);
    BaseObjectService.on(TYPE + '.' + BaseObjectService.BEFORE_DELETE, BookService.beforeDelete);
    BaseObjectService.on(TYPE + '.' + BaseObjectService.AFTER_DELETE, BookService.afterDelete);

    //exports
    return BookService;
};
