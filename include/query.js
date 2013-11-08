// Query parameters are returned as an associative array
global.getQueryParameters = function(request)
{
    this.urlParts = url.parse(request.url, true);
    return this.urlParts.query;
}

global.getPostParameters = function(request)
{
    var postString = request.headers['post'];
    this.urlParts = url.parse('?' + postString, true);
    return this.urlParts.query;
}
