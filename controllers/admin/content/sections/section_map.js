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
        
        session.section = 'sections';
        session.subsection = 'section_map';
    
        initLocalization(request, session, function(data)
        {
            getHTMLTemplate('admin/content/sections/section_map', null, null, function(data)
            {
                result = result.concat(data);
                
                if(session['error'])
                {
                    result = result.split('^error^').join('<div class="alert alert-danger">' + session['error'] + '</div>');
                    delete session['error'];
                }
                else
                {
                    result = result.split('^error^').join('');
                }
                
                if(session['success'])
                {
                    result = result.split('^success^').join('<div class="alert alert-success">' + session['success'] + '</div>');
                    delete session['success'];
                }
                else
                {
                    result = result.split('^success^').join('');
                }
                
                instance.getSections(function(sectionsList)
                {
                    result = result.split('^sections^').join(sectionsList);
                    
                    editSession(request, session, [], function(data)
                    {
                        output({cookie: getSessionCookie(session), content: localize(['admin', 'sections'], result)});
                    });
                });
            });
        });
    });
}

this.getSections = function(output)
{
    var sections = [];
    var sectionsList = '';
    
    getDBObjectsWithValues({object_type: 'section'}, function(data)
    {
        if(data.length > 0)
        {
            for(var i = 0; i < data.length; i++)
            {
                if(!data[i].parent)
                {
                    sectionsList = sectionsList.concat('<div class="panel panel-info"><a href="javascript:editSection(\'' + SITE_ROOT + '\', \'' + data[i]._id + '\')"><div class="panel-heading">' + data[i].name + '</div></a>');
                    subsection = '';
                    var subsectionCount = 0;
                    for(var j = 0; j < data.length; j++)
                    {
                        if(data[j].parent)
                        {
                            if(data[i]._id.equals(ObjectID(data[j].parent)))
                            {
                                if(subsection.length == 0)
                                {
                                    sectionsList = sectionsList.concat('<div class="panel-body">');
                                }
                                subsection = subsection.concat('<div class="col-md-3"><a href="javascript:editSection(\'' + SITE_ROOT + '\', \'' + data[j]._id + '\')"><div class="well well-sm">' + data[j].name + '</div></a></div>');
                                subsectionCount++;
                            }
                        }
                    }
                    if(subsection.length > 0)
                    {
                        sectionsList = sectionsList.concat(subsection + '</div>');
                    }
                    sectionsList = sectionsList.concat('</div>');
                }
            }
        }
        
        output(sectionsList);
    });
}
