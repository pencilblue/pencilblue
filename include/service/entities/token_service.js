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
    var util = pb.util;

    /**
     * A service that manages tokens for non-password authentication.
     *
     * @class TokenService
     * @constructor
     * @module Services
     * @submodule Entities
     * @param {Object} options
     * @param {String} options.site - site uid
     * @param {String} options.user - user id
     */
    function TokenService(options) {
        this.site = options.site;
        this.user = options.user;
    }

    /**
     * Generates and saves user token
     *
     * @method generateUserToken
     * @param {Function} cb
     */
    TokenService.prototype.generateUserToken = function(cb) {
        var self = this;
        var token = util.uniqueId();
        var tokenInfo = {
            token: token,
            user: self.user,
            used: false,
            site: this.site
        };

        this.saveToken(tokenInfo, function(err, result) {
            if(util.isError(err)) {
                return cb(err, null);
            }
            cb(null, {token: result.token});
        });

    };

    /**
     * Loads token information by token value and marks as used if found
     *
     * @method validateUserToken
     * @param {String} token
     * @param {Function} cb
     */
    TokenService.prototype.validateUserToken = function(token, cb) {
        var self = this;
        var dao = new pb.SiteQueryService({site: this.site, onlyThisSite: true});
        dao.loadByValue('token', token, 'auth_token', function(err, tokenInfo){
            if (util.isError(err) || !tokenInfo || tokenInfo.used) {
                return cb(err, false);
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

    /**
     * Saves token object
     *
     * @method saveToken
     * @param {Object} tokenInfo - the token object to save
     * @param {Function} cb
     */
    TokenService.prototype.saveToken = function(tokenInfo, cb) {
        var doc = pb.DocumentCreator.create('auth_token', tokenInfo);
        var dao = new pb.SiteQueryService(this.site, false);
        dao.save(doc, function(err, result) {
            if(util.isError(err)) {
                return cb(err, null);
            }
            cb(null, result);
        });
    };

    //exports
    return TokenService;
};