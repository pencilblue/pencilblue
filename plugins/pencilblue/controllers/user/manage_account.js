/*
    Copyright (C) 2015  PencilBlue, LLC

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

//dependencies
var async = require('async');

module.exports = function(pb) {

    //pb dependencies
    var util        = pb.util;
    var UserService = pb.UserService;
    var UrlService  = pb.UrlService;

    /**
     * Interface for logged in user to manage account information
     * @class ManageAccount
     * @constructor
     * @extends FormController
     */
    function ManageAccount(){}
    util.inherits(ManageAccount, pb.FormController);

    /**
     * Initializes the controller
     * @method init
     * @param {Object} context
     * @param {Function} cb
     */
    ManageAccount.prototype.init = function(context, cb) {
        var self = this;
        var init = function(err) {

            /**
             *
             * @property service
             * @type {TopicService}
             */
            self.service = new UserService(self.getServiceContext());

            cb(err, true);
        };
        ManageAccount.super_.prototype.init.apply(this, [context, init]);
    };

    /**
     *
     * @method render
     * @param {Function}
     */
    ManageAccount.prototype.render = function(cb) {
        var self = this;

        this.gatherData(function(err, data) {
            if(util.isError(err)) {
                return cb(err);
            }
            else if (data.user === null) {
                return self.redirect(UrlService.createSystemUrl('/', { hostname: self.hostname }), cb);
            }

            delete data.user.password;

            self.setPageName(self.ls.get('MANAGE_ACCOUNT'));
            self.ts.registerLocal('image_title', self.ls.get('USER_PHOTO'));
            self.ts.registerLocal('angular_objects', new pb.TemplateValue(pb.ClientJs.getAngularObjects(data), false));
            self.ts.load('user/manage_account', function(err, result) {
                cb({content: result});
            });
        });
    };

    /**
     *
     * @method gatherData
     * @param {Function} cb
     * @return {Array}
     */
    ManageAccount.prototype.gatherData = function(cb) {
        var self = this;
        var tasks = {

            navigation: function(callback) {
                callback(null, self.getNavigation());
            },

            pills: function(callback) {
                callback(null, self.getPills());
            },

            tabs: function(callback) {
                callback(null, self.getTabs());
            },

            locales: function(callback) {
                callback(null, pb.Localization.getSupportedWithDisplay());
            },

            user: function(callback) {
                self.service.get(self.session.authentication.user_id, callback);
            }
        };
        async.parallel(tasks, cb);
    };

    /**
     *
     * @method getNavigation
     * @return {Array}
     */
    ManageAccount.prototype.getNavigation = function() {
        return [
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
        ];
    };

    /**
     *
     * @method getTabs
     * @return {Array}
     */
    ManageAccount.prototype.getTabs = function() {
        return [
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
        ];
    };

    /**
     *
     * @method getPills
     * @return {Array}
     */
    ManageAccount.prototype.getPills = function() {
        return [
            {
                name: 'manage_account',
                title: this.ls.get('MANAGE_ACCOUNT'),
                icon: 'refresh',
                href: '/user/manage_account'
            }
        ];
    };

    //exports
    return ManageAccount;
};
