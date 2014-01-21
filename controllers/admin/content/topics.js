/*

    Topics settings
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2013, All rights reserved

*/

this.getPillNavOptions = function(activePill)
{
    var pillNavOptions = 
    [
        {
            name: 'manage_topics',
            title: '^loc_MANAGE_TOPICS^',
            icon: 'list-alt',
            href: '/admin/content/topics/manage_topics'
        },
        {
            name: 'new_topic',
            title: '^loc_NEW_TOPIC^',
            icon: 'plus',
            href: '/admin/content/topics/new_topic'
        },
        {
            name: 'import_topics',
            title: '^loc_IMPORT_TOPICS^',
            icon: 'upload',
            href: '/admin/content/topics/import_topics'
        }
    ];
    
    if(typeof activePill !== 'undefined')
    {
        for(var i = 0; i < pillNavOptions.length; i++)
        {
            if(pillNavOptions[i].name == activePill)
            {
                pillNavOptions[i].active = 'active';
            }
        }
    }
    
    return pillNavOptions;
};

this.init = function(request, output)
{
    output({redirect: pb.config.siteRoot + '/admin/content/topics/manage_topics'});
}
