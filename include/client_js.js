global.includeJS = function(url)
{
    return '<script type="text/javascript" src="' + url + '"></script>';
}

global.getJSTag = function(jsCode)
{
    return '<script type="text/javascript">' + jsCode + '</script>';
}
