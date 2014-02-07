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
            name: 'import_topics',
            title: '',
            icon: 'upload',
            href: '/admin/content/topics/import_topics'
        },
        {
            name: 'new_topic',
            title: '',
            icon: 'plus',
            href: '/admin/content/topics/new_topic'
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
