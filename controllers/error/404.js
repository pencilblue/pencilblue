// Retrieve the 404 template and return it to the router
this.init = function(request, output)
{
    var result = '';
    
    getHTMLTemplate('error/404', null, null, function(data)
    {
        result = result.concat(data);
        output({content: result});
    });
}
