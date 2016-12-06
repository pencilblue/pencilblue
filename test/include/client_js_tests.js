//dependencies
var should        = require('should');
var Configuration = require('../../include/config.js');
var Lib           = require('../../lib');

describe('AdminNavigation', function() {

    var pb = null;
    var ClientJs = null;
    before('Initialize the Environment with the default configuration', function() {
        this.timeout(10000);

        pb = new Lib(Configuration.getBaseConfig());
        ClientJs = pb.ClientJs;
    });

    describe('ClientJS.getAngularController', function() {

        it('should return a valid Angular controller', function() {
            var expectedResult = '<script type="text/javascript">\n'
                + 'var pencilblueApp = angular.module("pencilblueApp", ["ngRoute"])'
                + '.controller("PencilBlueController", function($scope, $sce) {});\n'
                + 'pencilblueApp.config(["$compileProvider",function(e) {'
                + 'e.aHrefSanitizationWhitelist(/^s*(https?|ftp|mailto|javascript):/)}]);\n</script>';

            ClientJs.getAngularController({}, []).should.have.property('raw').which.equal(expectedResult);

            expectedResult = '<script type="text/javascript">\n'
                + 'var pencilblueApp = angular.module("pencilblueApp", ["module"])'
                + '.controller("PencilBlueController", function($scope, $sce) {});\n'
                + 'pencilblueApp.config(["$compileProvider",function(e) {'
                + 'e.aHrefSanitizationWhitelist(/^s*(https?|ftp|mailto|javascript):/)}]);\n</script>';

            ClientJs.getAngularController({}, ['module']).should.have.property('raw').which.equal(expectedResult);
        });
    });
    
    describe('ClientJS.getAngularObjects', function() {

        it('should return a valid script tag containing the passed code', function() {
            var expectedResult = '$scope.foo = "bar";\n$scope.true = function(val){return true;};\n';

            ClientJs.getAngularObjects({foo: 'bar', true: 'function(val){return true;}'}).should.equal(expectedResult);
        });
    });
    
    describe('ClientJS.includeJS', function() {

        it('should return a valid script tag containing the passed url as source', function() {
            var expectedResult = '<script type="text/javascript" src="public/js/script.js"></script>';

            ClientJs.includeJS('public/js/script.js').should.have.property('raw').which.equal(expectedResult);
        });
    });
    
    describe('ClientJS.getJSTag', function() {

        it('should return a valid script tag containing the passed code', function() {
            var expectedResult = '<script type="text/javascript">\nalert(\'Hello World\')\n</script>';

            ClientJs.getJSTag('alert(\'Hello World\')').should.have.property('raw').which.equal(expectedResult);
        });
    });
});
