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
                scopeString = scopeString.concat('$scope.' + key + ' = ' + objects[key] + ";\n");
                continue;
            }
        }
        scopeString = scopeString.concat('$scope.' + key + ' = ' + JSON.stringify(objects[key], null, pb.log.isSilly() ? ' ' : undefined) + ";\n");
    }

    angularController = angularController.concat('function PencilBlueController($scope, $sce) {' + scopeString + "};\n");
    angularController = angularController.concat('pencilblueApp.config(["$compileProvider",function(e){e.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|javascript):/)}]);');

    return pb.js.getJSTag(angularController);
};

ClientJS.includeJS = function(url) {
    return new pb.TemplateValue('<script type="text/javascript" src="' + url + '"></script>', false);
};

ClientJS.getJSTag = function(jsCode) {
    return new pb.TemplateValue('<script type="text/javascript">\n' + jsCode + '\n</script>', false);
};

//exports
module.exports.ClientJS = ClientJS;
