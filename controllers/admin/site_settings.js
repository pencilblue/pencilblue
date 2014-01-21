/*

    Settings administration page
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2014, All rights reserved

*/

this.getPillNavOptions = function(activePill)
{
    var pillNavOptions = 
    [
        {
            name: 'configuration',
            title: '^loc_CONFIGURATION^',
            icon: 'flask',
            href: '/admin/site_settings/configuration'
        },
        {
            name: 'content',
            title: '^loc_CONTENT^',
            icon: 'quote-right',
            href: '/admin/site_settings/content'
        },
        {
            name: 'email',
            title: '^loc_EMAIL^',
            icon: 'envelope',
            href: '/admin/site_settings/email'
        }
    ]
    
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
    output({redirect: pb.config.siteRoot + '/admin/site_settings/configuration'});
}
