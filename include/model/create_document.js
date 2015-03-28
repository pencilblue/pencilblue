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

var util = require('../util.js');

module.exports = function DocumentCreatorModule(pb) {
    
    /**
     * Creates structures for persistence and cleans various fields.
     *
     * @module Model
     * @class DocumentCreator
     * @constructor
     * @main Model
     */
    function DocumentCreator(){}

    /**
     * Creates a document object ready to be injected into the database
     *
     * @method create
     * @param  {String} object_type        The type of object to create
     * @param  {Object} post               Key value pair object to prepare
     * @param  {Array}  [csvItems]         Keys whose values are to be split from CSVs into arrays
     * @param  {Array}  [nullIfEmptyItems] Keys whose values are to be null if empty
     * @return {Object}                    The database ready document object
     */
    DocumentCreator.create = function(object_type, post, csvItems, nullIfEmptyItems) {

        if(typeof csvItems !== 'undefined') {
            DocumentCreator.csvItemsToArrays(post, csvItems);
        }
        if(typeof nullIfEmptyItems !== 'undefined') {
            DocumentCreator.emptyItemsToNull(post, nullIfEmptyItems);
        }

        DocumentCreator.passwordHash(post);
        DocumentCreator.emailFormatting(post);
        DocumentCreator.usernameFormatting(post);
        DocumentCreator.accessFormatting(post);
        post['object_type'] = object_type;
        return post;
    };

    /**
     * Updates a document object with new properties
     *
     * @method update
     * @param  {Object} post               Key value pairs to update with
     * @param  {Object} existingObject     Object to update
     * @param  {Array}  [csvItems]         Keys whose values are to be split from CSVs into arrays
     * @param  {Array}  [nullIfEmptyItems] Keys whose values are to be null if empty
     * @return {Object}                    The database ready document object
     */
    DocumentCreator.update = function(post, existingObject, csvItems, nullIfEmptyItems) {
        var newDoc = DocumentCreator.create(existingObject.object_type, post, csvItems, nullIfEmptyItems);
        util.merge(newDoc, existingObject);
    };

    /**
     * Hashes all password fields
     *
     * @method passwordHash
     * @param {Object} post Key value pair object
     */
    DocumentCreator.passwordHash = function(post){
        if (!util.isObject(post)) {
            return false;
        }
        
        if (post.hasOwnProperty('password')) {
            post['password'] = pb.security.encrypt(post['password']);
        }

        if(post['confirm_password']) {
            delete post['confirm_password'];
        }
    };

    /**
     * Formats email fields
     *
     * @method emailFormatting
     * @param {Object} post Key value pair object
     */
    DocumentCreator.emailFormatting = function(post){
        if(util.isString(post['email'])) {
            post['email'] = post['email'].toLowerCase();
        }
    };

    /**
     * Formats usernames
     *
     * @method usernameFormatting
     * @param {Object} post Key value pair object
     */
    DocumentCreator.usernameFormatting = function(post){
        if(util.isString(post['username'])) {
            post['username'] = post['username'].toLowerCase();
        }
    };

    /**
     * Formats access levels
     *
     * @method accessFormatting
     * @param {Object} post Key value pair object
     */
    DocumentCreator.accessFormatting = function(post){
        if(post['admin']) {
            post['admin'] = parseInt(post['admin']);
        }
    };

    /**
     * Formats string items to integers
     *
     * @method formatIntegerItems
     * @param {Object} post         Key value pair object
     * @param {Array}  integerItems Keys whose values should be formatted as integers
     */
    DocumentCreator.formatIntegerItems = function(post, integerItems) {
        if (!util.isArray(integerItems) || !util.isObject(post)) {
            return false;
        }
        
        integerItems.forEach(function(item) {
            if (!util.isNullOrUndefined(post[item])) {
                post[item] = parseInt(post[item]);
            }
        });

        return post;
    };

    /**
     * Formats empty items to null values
     *
     * @method emptyItemsToNull
     * @param {Object} post             Key value pair object
     * @param {Array}  nullIfEmptyItems Keys whose values should be null if empty
     */
    DocumentCreator.emptyItemsToNull = function(post, nullIfEmptyItems) {
        if(!util.isArray(nullIfEmptyItems)) {
            return false;
        }

        nullIfEmptyItems.forEach(function(propertyName) {
            if (!post[propertyName] || post[propertyName].length == 0) {
                post[propertyName] = null;
            }
        });
        return true;
    };

    /**
     * Splits CSV items into arrays
     *
     * @method csvItemsToArrays
     * @param {Object} post     Key value pair object
     * @param {Array}  csvItems Keys whose values should be arrays
     */
    DocumentCreator.csvItemsToArrays = function(post, csvItems) {
        if (!util.isArray(csvItems) || !util.isObject(post)) {
            return false;
        }

        csvItems.forEach(function(csvItem) {
            if(util.isString(post[csvItem])) {

                var arrayItems = post[csvItem].split(',');
                for (var j = 0; j < arrayItems.length; j++) {
                    arrayItems[j] = arrayItems[j].trim();
                }
                post[csvItem] = arrayItems;
            }
            else {
                post[csvItem] = [];
            }
        });
        return true;
    };

    //exports
    return DocumentCreator;
};
