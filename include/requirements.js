global.url     = require('url');
global.fs      = require('fs');
global.http    = require('http');
global.path    = require('path');
global.process = require('process');

// Fixes fs on earlier versions of node
//TODO Find out if this is still needed!!!!
fs.exists = fs.exists || require('path').exists;
fs.existsSync = fs.existsSync || require('path').existsSync;

// Site-wide constants
require('./site_settings');
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
// Database connection
require('./mongo_connect');
// Database objects
require('./model/db_object');
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
