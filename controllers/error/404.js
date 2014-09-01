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
 * 404 error
 * @class NotFoundController
 * @constructor
 * @extends BaseController
 */
function NotFoundController(){}

//dependencies
var TopMenu = require('../../include/theme/top_menu');

//inheritance
util.inherits(NotFoundController, pb.BaseController);

/**
 * @see BaseController.render
 * @method render
 * @param {Function} cb
 */
NotFoundController.prototype.render = function(cb) {
	var self = this;

	this.setPageName('404');
    pb.content.getSettings(function(err, contentSettings) {
        
        var options = {
            currUrl: self.req.url
        };
        TopMenu.getTopMenu(self.session, self.ls, options, function(themeSettings, navigation, accountButtons) {
            TopMenu.getBootstrapNav(navigation, accountButtons, function(navigation, accountButtons) {

                //load template
                self.ts.registerLocal('navigation', new pb.TemplateValue(navigation, false));
                self.ts.registerLocal('account_buttons', new pb.TemplateValue(accountButtons, false));
                self.ts.load('error/404', function(err, data) {
                    var result = '' + data;

                    result = result.concat(pb.js.getAngularController(
                    {
                        navigation: navigation,
                        contentSettings: contentSettings,
                        loggedIn: pb.security.isAuthenticated(self.session),
                        accountButtons: accountButtons
                    }));

                    cb({content: result, code: 404, content_type: 'text/html'});
                });
            });
        });
    });
};

//exports
module.exports = NotFoundController;
