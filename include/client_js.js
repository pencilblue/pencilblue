function ClientJS(){}

ClientJS.getAngularController = function(objects, modules, directiveJS) {
    if(typeof modules === 'undefined' || modules.length == 0)
    {
        modules = ['ngRoute'];
    }
    
    var angularController;
    if(typeof directiveJS === 'undefined') {
        angularController = 'var pencilblueApp = angular.module("pencilblueApp", ' + JSON.stringify(modules) + ');';
    }
    else {
        angularController = 'var pencilblueApp = angular.module("pencilblueApp", ' + JSON.stringify(modules) + ').directive("onFinishRender", function($timeout){return {restrict: "A",link: function(scope, element, attr){if (scope.$last === true){$timeout(function(){' + directiveJS + '})}}}});';
    }
                            
    var scopeString = '';
    for(var key in objects) {
        if(typeof objects[key] === 'string') {
            if(objects[key].indexOf('function(') == 0) {
                scopeString = scopeString.concat('$scope.' + key + ' = ' + objects[key] + ';');
                continue;
            }
        }
        scopeString = scopeString.concat('$scope.' + key + ' = ' + JSON.stringify(objects[key]) + ';');
    }
    
    angularController = angularController.concat('function PencilBlueController($scope, $sce) {' + scopeString + '};');
    angularController = angularController.concat('pencilblueApp.config(["$compileProvider",function(e){e.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|javascript):/)}]);');
    
    return pb.js.getJSTag(angularController);
};

ClientJS.includeJS = function(url) {
    return '<script type="text/javascript" src="' + url + '"></script>';
};

ClientJS.getJSTag = function(jsCode) {
    return '<script type="text/javascript">' + jsCode + '</script>';
};

//exports
module.exports.ClientJS = ClientJS;
