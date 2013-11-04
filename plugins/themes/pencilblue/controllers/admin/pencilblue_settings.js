// Retrieve the header, body, and footer and return them to the router
this.init = function(request, output)
{
    var result = '';
    var instance = this;
    
    getSession(request, function(session)
    {
        if(!session['user'] || !session['user']['admin'])
        {
            output({content: ''});
            return;
        }
        
        session.section = 'themes';
        session.subsection = 'pencilblue';
    
        initLocalization(request, session, function(data)
        {
            getHTMLTemplate('admin/pencilblue_settings', null, null, function(data)
            {
                result = result.concat(data);
                output({content: localize(['admin', 'themes', 'pencilblue_settings'], result)});
            });
        });
    });
}
