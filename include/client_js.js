global.includeJS = function(url)
{
    return '<script type="text/javascript" src="' + url + '"></script>';
}

global.getJSTag = function(jsCode)
{
    return '<script type="text/javascript">' + jsCode + '</script>';
}

global.getAngularController = function(objects)
{
    var angularController = '';
    
    var scopeString = '';
    for(var key in objects)
    {
        scopeString = scopeString.concat('$scope.' + key + ' = ' + JSON.stringify(objects[key]) + ';');
    }
    
    angularController = angularController.concat('function PencilBlueController($scope) {' + scopeString + '};');
    
    return getJSTag(angularController);
}
