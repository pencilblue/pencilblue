/*

    Index page of the pencilblue theme
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2013, All rights reserved

*/

this.init = function(request, output)
{
    var result = '';
    
    getDBObjectsWithValues({object_type: 'user'}, function(data)
    {
        if(data.length == 0)
        {
            output({redirect: SITE_ROOT + '/setup'});
            return;
        }
    
        getSession(request, function(session)
        {
            initLocalization(request, session, function(data)
            {
                getHTMLTemplate('head', 'Home', null, function(data)
                {
                    require('../include/section_map.js').setSectionMap(data, function(headLayout)
                    {
                        result = result.concat(headLayout);
                        getHTMLTemplate('index', null, null, function(data)
                        {
                            result = result.concat(data);
                            getHTMLTemplate('footer', null, null, function(data)
                            {
                                result = result.concat(data);
                                output({cookie: getSessionCookie(session), content: localize(['pencilblue_generic'], result)});
                            });
                        });
                    });
                });
            });
        });
    });
}
