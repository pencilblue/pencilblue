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

const passport = require('koa-passport');
const request = require('request');

module.exports = function LoginSFSSOControllerModule(pb) {

    //dependencies
    var FormController = pb.FormController;

    /**
     * Authenticates a user via Salesforce
     * @class LoginSFActionControllerModule
     * @constructor
     * @extends FormController
     */
    class LoginSFSSOController extends pb.BaseController {
        render(cb) {
            this.sanitizeObject(this.body);
            this.salesforceSSO(cb);
        }


        salesforceSSO(cb) {
            return passport.authenticate('salesforce', (err, options) => {
                request(options).pipe(this.res);
            })(this.ctx);
        }
    }

    return LoginSFSSOController;
};