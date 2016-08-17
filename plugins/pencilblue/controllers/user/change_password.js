/*
    Copyright (C) 2016  PencilBlue, LLC

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
'use strict';

module.exports = function (pb) {

    //pb dependencies
    var util = pb.util;
    var UserService = pb.UserService;
    var ClientJs = pb.ClientJs;

    /**
     * Interface for logged in user to change password
     * @class ChangePasswordFormController
     * @constructor
     * @extends FormController
     */
    function ChangePasswordFormController(){}
    util.inherits(ChangePasswordFormController, pb.FormController);

    /**
     * @method initSync
     */
    ChangePasswordFormController.prototype.initSync = function(/*context*/) {

        /**
         * @property userService
         * @type {UserService}
         */
        this.userService = new UserService(this.getServiceContext());
    };

    /**
     *
     * @method render
     * @param {function} cb (Error|object)
     */
    ChangePasswordFormController.prototype.render = function(cb) {
        var self = this;

        //retrieve user
        this.userService.get(self.session.authentication.user_id, {}, function(err, user) {
            if(util.isError(err)) {
                return cb(err);
            }
            if (user === null) {
                return self.redirect('/', cb);
            }

            var uiEntities = ChangePasswordFormController.gatherNavData(self.ls);
            uiEntities.resetPassword = self.session.authentication.reset_password || false;
            var angularObjects = ClientJs.getAngularObjects(uiEntities);
            self.setPageName(self.ls.g('users.CHANGE_PASSWORD'));
            self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
            self.ts.load('user/change_password', function(err, result) {

                cb({content: result});
            });
        });
    };

    /**
     * @deprecated
     * @method gatherData
     * @return {object}
     */
    ChangePasswordFormController.prototype.gatherData = function() {
        return ChangePasswordFormController.gatherNavData(this.ls);
    };

    /**
     * Gathers up all of the necessary navigation data
     * @param {Localization} ls
     * @return {{navigation: *[], pills: *[], tabs: *[]}}
     */
    ChangePasswordFormController.gatherNavData = function(ls) {
        return {
            navigation: [
                {
                    id: 'account',
                    active: 'active',
                    title: ls.g('generic.ACCOUNT'),
                    icon: 'user',
                    href: '#',
                    dropdown: true,
                    children:
                        [
                            {
                                id: 'manage',
                                title: ls.g('users.MANAGE_ACCOUNT'),
                                icon: 'cog',
                                href: '/user/manage_account'
                            },
                            {
                                id: 'change_password',
                                active: 'active',
                                title: ls.g('users.CHANGE_PASSWORD'),
                                icon: 'key',
                                href: '/user/change_password'
                            }
                        ]
                }
            ],

            pills: [
                {
                    name: 'change_password',
                    title: ls.g('users.CHANGE_PASSWORD'),
                    icon: 'refresh',
                    href: '/user/change_password'
                }
            ],

            tabs: [
                {
                    active: 'active',
                    href: '#password',
                    icon: 'key',
                    title: ls.g('users.PASSWORD')
                }
            ]
        };
    };

    //exports
    return ChangePasswordFormController;
};
