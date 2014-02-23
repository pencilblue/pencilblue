/**
 * NewUser - Interface for adding a new user
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function NewUser(){}

//inheritance
util.inherits(NewUser, pb.BaseController);

NewUser.prototype.render = function(cb) {
	var self = this;
	
	pb.templates.load('admin/users/new_user', '^loc_NEW_USER^', null, function(data) {
        var result = ('' + data)
        	.split('^image_title^').join('^loc_USER_PHOTO^')
        	.split('^uploaded_image^').join('');
        
        var tabs = [
            {
                active: 'active',
                href: '#account_info',
                icon: 'cog',
                title: '^loc_ACCOUNT_INFO^'
            },
            {
                href: '#personal_info',
                icon: 'user',
                title: '^loc_PERSONAL_INFO^'
            }
        ];
    
        self.displayErrorOrSuccess(result, function(newResult) {
            result = newResult;
            
            var pills = require('../users').getPillNavOptions('new_user');
            pills.unshift(
            {
                name: 'manage_users',
                title: '^loc_NEW_USER^',
                icon: 'chevron-left',
                href: '/admin/users/manage_users'
            });
            
            result = result.concat(pb.js.getAngularController(
            {
                navigation: pb.AdminNavigation.get(self.session, ['users']),
                pills: pills,
                tabs: tabs,
                adminOptions: NewUser.getAdminOptions(self.session)
            }));
            
            var content = self.localizationService.localize(['admin', 'users', 'media'], result);
            cb({content: content});
        });
    });
};


NewUser.getAdminOptions = function(session) {
    var adminOptions = [
        {name: localize([], '^loc_READER^'), value: ACCESS_USER},
        {name: localize([], '^loc_WRITER^'), value: ACCESS_WRITER},
        {name: localize([], '^loc_EDITOR^'), value: ACCESS_EDITOR}
    ];
    
    if(session.authentication.user.admin >= ACCESS_MANAGING_EDITOR) {
        adminOptions.push({name: localize([], '^loc_MANAGING_EDITOR^'), value: ACCESS_MANAGING_EDITOR});
    }
    if(session.authentication.user.admin >= ACCESS_ADMINISTRATOR) {
        adminOptions.push({name: localize([], '^loc_ADMINISTRATOR^'), value: ACCESS_ADMINISTRATOR});
    }
    
    return adminOptions;
};

//exports
module.exports = NewUser;
