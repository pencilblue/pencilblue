global.url       = require('url');
global.fs        = require('fs');
global.http      = require('http');
global.path      = require('path');
global.process   = require('process');

//setup promises
global.promise   = require('node-promise');
global.when      = promise.when;
global.Promise   = promise.Promise;

// Fixes fs on earlier versions of node
//TODO Find out if this is still needed!!!!
fs.exists     = fs.exists     || path.exists;
fs.existsSync = fs.existsSync || path.existsSync;

//Site-wide constants
require('./site_settings');

//setup DBManager
global.dbmanager = new (require('./dao/db_manager').DBManager);

// ContentType responses
require('./response_head');
// URL routing
require('./router');
// Query parameter retrieval
require('./query');
// Unique ID
require('./unique_id');
// Sessions
require('./session');
// Database objects
require('./model/db_object');
require('./model/dao.js');
// Document creation
require('./model/create_document.js');
// Templatizing
require('./templates');
// Localization
require('./localization');
// Client JS
require('./client_js');
// Admin Navigation
require('./admin_navigation');
// Error and Success Message Handling
require('./error_success');

// Edit custom_requirements.js to add your own file requirements
//require('./custom_requirements');
