global.includeJS = function(url)
{
    return '<script type="text/javascript" src="' + url + '"></script>';
}

global.getJSTag = function(jsCode)
{
    return '<script type="text/javascript">' + jsCode + '</script>';
}

global.getAngularController = function(objects, modules, directiveJS)
{
    if(typeof modules === 'undefined')
    {
        modules = [];
    }
    if(typeof directiveJS === 'undefined')
    {
        var angularController = 'var pencilblueApp = angular.module("pencilblueApp", ' + JSON.stringify(modules) + ')';
    }
    else
    {
        var angularController = 'var pencilblueApp = angular.module("pencilblueApp", ' + JSON.stringify(modules) + ').directive("onFinishRender", function($timeout){return {restrict: "A",link: function(scope, element, attr){if (scope.$last === true){$timeout(function(){' + directiveJS + '})}}}});';
    }
                            
    
    var scopeString = '';
    for(var key in objects)
    {
        if(typeof objects[key] === 'string')
        {
            if(objects[key].indexOf('function(') == 0)
            {
                scopeString = scopeString.concat('$scope.' + key + ' = ' + objects[key] + ';');
                continue;
            }
        }
        scopeString = scopeString.concat('$scope.' + key + ' = ' + JSON.stringify(objects[key]) + ';');
    }
    
    angularController = angularController.concat('function PencilBlueController($scope, $sce) {' + scopeString + '};');
    
    return getJSTag(angularController);
}
