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
	pb.utils.merge(newDoc, existingObject);
};

/**
 * Hashes all password fields
 *
 * @method passwordHash
 * @param {Object} post Key value pair object
 */
DocumentCreator.passwordHash = function(post){
    for(var key in post) {
        if(key.indexOf('password') > -1)
        {
            post[key] = pb.security.encrypt(post[key]);
        }
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
	if(post['email']) {
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
	if(post['username']) {
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
    for (var i = 0; i < integerItems.length; i++) {
        if (typeof post[integerItems[i]] !== 'undefined') {
            post[integerItems[i]] = parseInt(post[integerItems[i]]);
        }
    }

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
    if(!nullIfEmptyItems) {
        return;
    }

    for (var i = 0; i < nullIfEmptyItems.length; i++) {
        if (post[nullIfEmptyItems[i]]) {
            if(post[nullIfEmptyItems[i]].length == 0) {
                post[nullIfEmptyItems[i]] = null;
            }
        }
        else {
            post[nullIfEmptyItems[i]] = null;
        }
    }
};

/**
 * Splits CSV items into arrays
 *
 * @method csvItemsToArrays
 * @param {Object} post     Key value pair object
 * @param {Array}  csvItems Keys whose values should be arrays
 */
DocumentCreator.csvItemsToArrays = function(post, csvItems) {
    if (!csvItems) {
        return;
    }

    for (var i = 0; i < csvItems.length; i++) {
        if(post[csvItems[i]]) {

        	var arrayItems = post[csvItems[i]].split(',');
            for (var j = 0; j < arrayItems.length; j++) {
                arrayItems[j] = arrayItems[j].trim();
            }
            post[csvItems[i]] = arrayItems;
        }
        else {
            post[csvItems[i]] = [];
        }
    }
};

//exports
module.exports.DocumentCreator = DocumentCreator;
