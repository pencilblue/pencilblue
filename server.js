const serveInstance = require('./new_main');

const Configuration = require('./include/config.js');

module.exports = new serveInstance(Configuration.load()).startup();
