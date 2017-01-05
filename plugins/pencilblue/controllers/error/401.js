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

//dependencies
var path = require('path');

module.exports = function (pb) {

    //pb dependencies
    var util    = pb.util;
    var RequestHandler = pb.RequestHandler;

    /**
     * 404 error
     * @class NotAuthorizedController
     * @constructor
     * @extends BaseController
     */
    function NotAuthorizedController(){}
    util.inherits(NotAuthorizedController, pb.BaseController);

    /**
     * Initializes the controller
     * @method initSync
     * @param {Object} context
     */
    NotAuthorizedController.prototype.initSync = function(/*context*/) {
        this.setPageName(this.ls.g('error.NOT_AUTHORIZED'));
    };

    /**
     * @method render
     * @param {function} cb (Error|object)
     */
    NotAuthorizedController.prototype.render = function(cb) {

        var urlObj = this.reqHandler.url;
        this.session.on_login = this.req.method.toLowerCase() === 'get' ? urlObj.href :
            pb.UrlService.createSystemUrl('/admin', { hostname: this.hostname });

        var location = RequestHandler.isAdminURL(urlObj.pathname) ? '/admin/login' : '/user/login';
        this.redirect(location, cb);
    };

    //exports
    return NotAuthorizedController;
};
