/**

    Pages administration page
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2014, All rights reserved

*/
function Pages(){}

Pages.getPillNavOptions = function(activePill) {
    var pillNavOptions = [
        {
            name: 'new_page',
            title: '',
            icon: 'plus',
            href: '/admin/content/pages/new_page'
        }
    ];
    
    if(typeof activePill !== 'undefined') {
        for(var i = 0; i < pillNavOptions.length; i++) {
            if(pillNavOptions[i].name == activePill) {
                pillNavOptions[i].active = 'active';
                break;
            }
        }
    }
    
    return pillNavOptions;
};

//exports
module.exports = Pages;
