/**
 * ChangePasswordController - UI for allowing a user to change their password
 *
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function ChangePasswordController(){}

//inheritance
util.inherits(ChangePasswordController, pb.FormController);

ChangePasswordController.prototype.render = function(cb) {
    var self = this;

    var dao = new pb.DAO();
    dao.loadById(self.session.authentication.user_id, 'user', function(err, user) {
        if(util.isError(err) || user === null) {
            self.redirect(pb.config.siteRoot, cb);
            return;
        }


        self.setPageName(self.ls.get('CHANGE_PASSWORD'));
        self.ts.registerLocal('angular_script', pb.js.getAngularController(self.gatherData()));
        self.ts.load('user/change_password', function(err, result) {

            cb({content: result});
        });
    });
};

ChangePasswordController.prototype.gatherData = function() {
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
                        title: this.ls.get('MANAGE_ACCOUNT'),
                        icon: 'cog',
                        href: '/user/manage_account',
                    },
                    {
                        id: 'change_password',
                        active: 'active',
                        title: this.ls.get('CHANGE_PASSWORD'),
                        icon: 'key',
                        href: '/user/change_password',
                    }
                ]
            }
        ],

        pills: [
            {
                name: 'change_password',
                title: this.ls.get('CHANGE_PASSWORD'),
                icon: 'refresh',
                href: '/user/change_password'
            }
        ],

        tabs: [
            {
                active: 'active',
                href: '#password',
                icon: 'key',
                title: this.ls.get('PASSWORD')
            }
        ]
    };
};

//exports
module.exports = ChangePasswordController;
