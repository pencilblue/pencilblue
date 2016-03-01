
//dependencies
var should        = require('should');
var Configuration = require('../../../include/config.js');
var Lib           = require('../../../lib');

describe('AnalyticsManager', function(){

    var pb = null;
    var AnalyticsManager = null;
    before('Initialize the Environment with the default configuration', function() {
        this.timeout(10000);

        pb = new Lib(Configuration.getBaseConfig());
        AnalyticsManager = pb.AnalyticsManager;
    });
});
