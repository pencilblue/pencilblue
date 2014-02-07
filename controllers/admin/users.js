/*

    Users administration page
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2013, All rights reserved

*/

this.getPillNavOptions = function(activePill)
{
    var pillNavOptions = 
    [
        {
            name: 'new_user',
            title: '',
            icon: 'plus',
            href: '/admin/users/new_user'
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
    output({redirect: pb.config.siteRoot + '/admin/users/manage_users'});
}
