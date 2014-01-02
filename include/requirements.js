/**
 * Requirements - Responsible for declaring all of the system types and modules 
 * needed to construct the system API object.
 * @copyright PencilBlue, all rights reserved.
 */
//setup global resources & modules
global.url        = require('url');
global.fs         = require('fs');
global.http       = require('http');
global.path       = require('path');
global.formidable = require('formidable');
global.process    = require('process');
global.minify     = require('minify');
global.winston    = require('winston');
global.async      = require('async');

var promise       = require('node-promise');
global.when       = promise.when;
global.Promise    = promise.Promise;

//hack for fs module
fs.exists     = fs.exists     || path.exists;
fs.existsSync = fs.existsSync || path.existsSync;

//define what will become the global entry point into the server api.
var pb = {};

//load the configuration
pb.config = require('./config');

//configure logging
global.log = 
pb.log = require(DOCUMENT_ROOT+'/include/utils/logging.js').logger(winston, pb.config);

//configure the DB manager
pb.dbm = new (require(DOCUMENT_ROOT+'/include/dao/db_manager').DBManager);

//setup system class types
pb.DAO = require(DOCUMENT_ROOT+'/include/dao/dao');

//system requires
require(DOCUMENT_ROOT+'/include/response_head');			//ContentType responses
require(DOCUMENT_ROOT+'/include/router');					// URL routing
require(DOCUMENT_ROOT+'/include/query');					// Query parameter retrieval
require(DOCUMENT_ROOT+'/include/unique_id');				// Unique ID
require(DOCUMENT_ROOT+'/include/session');					// Sessions
require(DOCUMENT_ROOT+'/include/model/db_object');			// Database objects
require(DOCUMENT_ROOT+'/include/access_management.js');		// Access management
require(DOCUMENT_ROOT+'/include/model/create_document.js');	// Document creation
require(DOCUMENT_ROOT+'/include/templates');				// Templatizing
require(DOCUMENT_ROOT+'/include/localization');				// Localization
require(DOCUMENT_ROOT+'/include/client_js');				// Client JS
require(DOCUMENT_ROOT+'/include/admin_navigation');			// Admin Navigation
require(DOCUMENT_ROOT+'/include/error_success');			// Error and Success Message Handling
require(DOCUMENT_ROOT+'/include/form');			            // Retrieving of form data through sessions

//Export system object
module.exports = pb;
