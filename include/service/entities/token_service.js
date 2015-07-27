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

var crypto = require('crypto');

module.exports = function TokenServiceModule(pb) {

    //
    /**
     * A service that manages tokens for non-password authentication.
     *
     * @class TokenService
     * @constructor
     * @module Services
     * @submodule Entities
     */
    function TokenService(options) {
        this.site = options.site;
        this.dao = new pb.SiteQueryService(this.site, false);
        this.user = options.user;
    }

    TokenService.prototype.generateUserToken = function(cb) {
        crypto.randomBytes(48, function(err, buf) {
            if(pb.util.isError(err)) {
                return cb(err, null);
            }
            var token = buf.toString('hex');
            //TODO: Create and store token entity
            cb(null, token);
        });
    };

    TokenService.prototype.validateUserToken = function(token, cb) {
        cb(null, true);
    };

    //exports
    return TokenService;
};