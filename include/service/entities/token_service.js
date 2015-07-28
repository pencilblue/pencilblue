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

module.exports = function TokenServiceModule(pb) {

    //dependencies
    var crypto = require('crypto');
    var util = pb.util;

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
        var self = this;
        var token = util.uniqueId();
        //TODO: Create and store token entity
        var tokenInfo = {
            token: token,
            user: self.user,
            used: false
        }
        this.saveToken(tokenInfo, cb);

    };

    TokenService.prototype.saveToken = function(tokenInfo, cb) {
        var doc = pb.DocumentCreator.create('auth_token', tokenInfo);
        this.dao.save(doc, function(err, result) {
            if(util.isError(err)) {
                return cb(err, null);
            }
            cb(null, {token: tokenInfo.token});
        });
    };

    TokenService.prototype.validateUserToken = function(token, cb) {
        var self = this;
        this.dao.loadByValue('token', token, 'auth_token', function(err, tokenInfo){
            if(util.isError(err)) {
                return cb(err, null);
            }
            if(!tokenInfo || tokenInfo.used) {
                return cb(null, false);
            }

            tokenInfo.used = true;
            self.saveToken(tokenInfo, function(err, result) {
                if(util.isError(err)) {
                    return cb(err, null);
                }
                var timeDiff = Date.now() - tokenInfo.created;
                var response = {
                    tokenInfo: result,
                    valid: timeDiff < 300000
                };
                cb(null, response);
            });
        });
    };

    //exports
    return TokenService;
};