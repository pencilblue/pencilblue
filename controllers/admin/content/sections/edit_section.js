/*

    Input for editing a site section
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2013, All rights reserved

*/

this.init = function(request, output)
{
    var result = '';
    var instance = this;
    
    getSession(request, function(session)
    {
        if(!userIsAuthorized(session, {logged_in: true, admin_level: ACCESS_EDITOR}))
        {
            output({redirect: pb.config.siteRoot + '/admin'});
            return;
        }
        
        var get = getQueryParameters(request);
        if(!get['id'])
        {
            output({redirect: pb.config.siteRoot + '/admin/sections/section_map'});
            return;
        }
        
        getDBObjectsWithValues({object_type: 'section', _id: ObjectID(get['id'])}, function(data)
        {
            if(data.length == 0)
            {
                output({redirect: pb.config.siteRoot + '/admin/sections/section_map'});
                return;
            }
            
            var section = data[0];
            section.keywords = section.keywords.join(',');
        
            initLocalization(request, session, function(data)
            {
                getHTMLTemplate('admin/content/sections/edit_section', '^loc_EDIT_SECTION^', null, function(data)
                {
                    result = result.concat(data);
                    
                    result = result.split('^section_id^').join(section._id);
                    
                    var tabs =
                    [
                        {
                            active: 'active',
                            href: '#section_settings',
                            icon: 'cog',
                            title: '^loc_SETTINGS^'
                        },
                        {
                            href: '#section_meta_data',
                            icon: 'tasks',
                            title: '^loc_META_DATA^'
                        }
                    ];
                    
                    displayErrorOrSuccess(session, result, function(newSession, newResult)
                    {
                        session = newSession;
                        result = newResult;
                        
                        getDBObjectsWithValues({object_type: 'section', parent: null, $orderby: {name: 1}}, function(parents)
                        {
                            instance.getEditors(session, function(editors)
                            {
                                result = result.concat(getAngularController({pills: require('../sections').getPillNavOptions('edit_section'), tabs: tabs, parents: parents, editors: editors, section: section, submitURL: '/actions/admin/content/sections/edit_section?id=' + section._id}));
                            
                                editSession(request, session, [], function(data)
                                {
                                    output({cookie: getSessionCookie(session), content: localize(['admin', 'sections'], result)});
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}

this.getEditors = function(session, output)
{
    var editors = [];
    
    getDBObjectsWithValues({object_type: 'user', admin: {$gt: ACCESS_WRITER}}, function(data)
    {
        for(var i = 0; i < data.length; i++)
        {
            var editor = {_id: data[0]._id, name: data[0].first_name + ' ' + data[0].last_name};
            
            editors.push(editor);
        }
        
        output(editors);
    });
}
