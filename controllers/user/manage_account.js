/**
 * ManageAccount - UI for account management
 *
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function ManageAccount(){}

//inheritance
util.inherits(ManageAccount, pb.FormController);

ManageAccount.prototype.render = function(cb) {
	var self = this;

    var dao = new pb.DAO();
    dao.loadById(self.session.authentication.user_id, 'user', function(err, user) {
        if(util.isError(err) || user === null) {
            self.redirect(pb.config.siteRoot, cb);
            return;
        }

        delete user.password;
        var objects  = self.gatherData();
        objects.user = user;

    	self.setPageName(self.ls.get('MANAGE_ACCOUNT'));
        self.ts.registerLocal('image_title', self.ls.get('USER_PHOTO'));
        self.ts.registerLocal('uploaded_image', (user.photo ? user.photo : ''));
        self.ts.registerLocal('angular_script', pb.js.getAngularController(objects));
    	self.ts.load('user/manage_account', function(err, result) {

            cb({content: result});
        });
    });
};

ManageAccount.prototype.gatherData = function() {
    return {

        navigation: [
            {
                id: 'account',
                active: 'active',
                title: this.ls.get('ACCOUNT'),
                icon: 'user',
                href: '#',
                dropdown: true,
                children:
                [
                    {
                        id: 'manage',
                        active: 'active',
                        title: this.ls.get('MANAGE_ACCOUNT'),
                        icon: 'cog',
                        href: '/user/manage_account',
                    },
                    {
                        id: 'change_password',
                        title: this.ls.get('CHANGE_PASSWORD'),
                        icon: 'key',
                        href: '/user/change_password',
                    }
                ]
            }
        ],

        pills: [
            {
                name: 'manage_account',
                title: this.ls.get('MANAGE_ACCOUNT'),
                icon: 'refresh',
                href: '/user/manage_account'
            }
        ],

        tabs: [
            {
                active: 'active',
                href: '#account_info',
                icon: 'cog',
                title: this.ls.get('ACCOUNT_INFO')
            },
            {
                href: '#personal_info',
                icon: 'user',
                title: this.ls.get('PERSONAL_INFO')
            }
        ]
    };
};

//exports
module.exports = ManageAccount;
