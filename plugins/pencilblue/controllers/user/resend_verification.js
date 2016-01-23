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

module.exports = function ResendVerificationModule(pb) {
  //pb dependencies
  var util = pb.util;

  /**
   * Interface for resending a verification email
   */
  function ResendVerification(){}
  util.inherits(ResendVerification, pb.BaseController);
  ResendVerification.prototype.render = function(cb) {
    var self = this;
    var contentService = new pb.ContentService({site: self.site, onlyThisSite: true});
    contentService.getSettings(function(err, contentSettings) {

      /*if(!contentSettings.allow_comments || !contentSettings.require_verification) {
          self.redirect('/', cb);
          return;
      }*/

      self.gatherData(function(err, data) {
        self.ts.registerLocal('navigation', new pb.TemplateValue(data.nav.navigation, false));
        self.ts.registerLocal('account_buttons', new pb.TemplateValue(data.nav.accountButtons, false));
        self.ts.load('user/resend_verification', function(err, data) {
          cb({content: data});
        });
      });
    
    });
  };

  ResendVerification.prototype.gatherData = function(cb) {
    var self  = this;
    var tasks = {
      //navigation
      nav: function(callback) {
        self.getNavigation(function(themeSettings, navigation, accountButtons) {
          callback(null, {themeSettings: themeSettings, navigation: navigation, accountButtons: accountButtons});
        });
      }
    };
    async.parallel(tasks, cb);
  };

  ResendVerification.prototype.getNavigation = function(cb) {
    var options = {
      currUrl: this.req.url,
      session: this.session,
      ls: this.ls,
      activeTheme: this.activeTheme
    };

    var menuService = new pb.TopMenuService();
    menuService.getNavItems(options, function(err, navItems) {
      if (util.isError(err)) {
        pb.log.error('Index: %s', err.stack);
      }
      cb(navItems.themeSettings, navItems.navigation, navItems.accountButtons);
    });
  };

  //exports
  return ResendVerification;
};
