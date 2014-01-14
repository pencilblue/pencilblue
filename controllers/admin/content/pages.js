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
            name: 'manage_pages',
            title: '^loc_MANAGE_PAGES^',
            icon: 'file-o',
            href: '/admin/content/pages/manage_pages'
        },
        {
            name: 'new_page',
            title: '^loc_NEW_PAGE^',
            icon: 'plus',
            href: '/admin/content/pages/new_page'
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
    output({redirect: pb.config.siteRoot + '/admin/content/pages/manage_pages'});
}
