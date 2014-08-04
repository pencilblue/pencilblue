/*
    Copyright (C) 2014  PencilBlue, LLC

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/**
 * Interface for logged in user to change password
 */

function ChangePasswordController(){}

//inheritance
util.inherits(ChangePasswordController, pb.FormController);

ChangePasswordController.prototype.render = function(cb) {
    var self = this;

    var dao = new pb.DAO();
    dao.loadById(self.session.authentication.user_id, 'user', function(err, user) {
        if(util.isError(err) || user === null) {
            self.redirect('/', cb);
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
