/**

    Pages administration page
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2014, All rights reserved

*/
function Pages(){}

Pages.getPillNavOptions = function(activePill) {
    return [
        {
            name: 'new_page',
            title: '',
            icon: 'plus',
            href: '/admin/content/pages/new_page'
        }
    ];
};

//exports
module.exports = Pages;
