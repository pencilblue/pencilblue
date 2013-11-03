// Query parameters are returned as an associative array
global.getQueryParameters = function(request)
{
    this.urlParts = url.parse(request.url, true);
    return this.urlParts.query;
}

global.getPostParameters = function(postString)
{
    this.urlParts = url.parse('?' + postString, true);
    return this.urlParts.query;
}
