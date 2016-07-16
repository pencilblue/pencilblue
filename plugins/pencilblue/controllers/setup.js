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

module.exports = function SetupViewControllerModule(pb) {

    //pb dependencies
    var util = pb.util;

    /**
     * Initial setup page
     * @class SetupViewController
     * @constructor
     * @extends BaseController
     */
    function SetupViewController(){}
    util.inherits(SetupViewController, pb.BaseController);

    /**
     *
     * @method render
     * @param {Function} cb
     */
    SetupViewController.prototype.render = function(cb) {
        var self = this;

        pb.settings.get('system_initialized', function(err, isSetup){
            if (util.isError(err)) {
                throw new PBError("A database connection could not be established", 500);
            }

            //when user count is 1 or higher the system has already been initialized
            if (isSetup) {
                self.redirect('/', cb);
                return;
            }

            self.doSetup(cb);
        });

    };

    /**
     *
     * @method doSetup
     * @param {Function} cb
     */
    SetupViewController.prototype.doSetup = function(cb) {
        this.setPageName('Setup');
        this.ts.registerLocal('global_root', function(flag, cb) {
            cb(null, pb.SiteService.getHostWithProtocol(pb.config.multisite.enabled ? pb.config.multisite.globalRoot : pb.config.siteRoot));
        });
        this.ts.load('setup', function(err, data) {
            cb({content: data});
        });
    };

    //exports
    return SetupViewController;
};
