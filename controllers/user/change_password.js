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

        var navigation = [
            {
                id: 'account',
                active: 'active',
                title: self.ls.get('ACCOUNT'),
                icon: 'user',
                href: '#',
                dropdown: true,
                children:
                [
                    {
                        id: 'manage',
                        title: self.ls.get('MANAGE_ACCOUNT'),
                        icon: 'cog',
                        href: '/user/manage_account',
                    },
                    {
                        id: 'change_password',
                        active: 'active',
                        title: self.ls.get('CHANGE_PASSWORD'),
                        icon: 'key',
                        href: '/user/change_password',
                    }
                ]
            }
        ];

        var pills = [
            {
                name: 'change_password',
                title: self.ls.get('CHANGE_PASSWORD'),
                icon: 'refresh',
                href: '/user/change_password'
            }
        ];

        var tabs = [
            {
                active: 'active',
                href: '#password',
                icon: 'key',
                title: self.ls.get('PASSWORD')
            }
        ];

        self.setPageName(self.ls.get('CHANGE_PASSWORD'));
        self.ts.load('user/change_password', function(err, result) {

            result = result.split('^angular_script^').join(pb.js.getAngularController(
            {
                navigation: navigation,
                pills: pills,
                tabs: tabs
            }));

            cb({content: result});
        });
    });
};

//exports
module.exports = ManageAccount;
