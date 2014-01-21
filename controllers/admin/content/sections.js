/*

    Pages administration page
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2013, All rights reserved

*/

this.getPillNavOptions = function(activePill)
{
    var pillNavOptions = 
    [
        {
            name: 'section_map',
            title: '^loc_SECTION_MAP^',
            icon: 'sitemap',
            href: '/admin/content/sections/section_map'
        },
        {
            name: 'new_section',
            title: '^loc_NEW_SECTION^',
            icon: 'plus',
            href: '/admin/content/sections/new_section'
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
    output({redirect: pb.config.siteRoot + '/admin/content/topics/section_map'});
}
