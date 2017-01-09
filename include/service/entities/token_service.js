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
var _ = require('lodash');
var uuid = require('uuid');

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
class TokenService {
    constructor(options) {
        this.site = options.site;
        this.user = options.user;
    }

    /**
     * Generates and saves user token
     *
     * @method generateUserToken
     * @param {Function} cb
     */
    generateUserToken(cb) {
        var self = this;
        var token = uuid.v4();
        var tokenInfo = {
            token: token,
            user: self.user,
            used: false,
            site: this.site
        };

        this.saveToken(tokenInfo, function (err, result) {
            if (_.isError(err)) {
                return cb(err, null);
            }
            cb(null, {token: result.token});
        });

    }

    /**
     * Loads token information by token value and marks as used if found
     *
     * @method validateUserToken
     * @param {String} token
     * @param {Function} cb
     */
    validateUserToken(token, cb) {
        var self = this;
        var dao = new SiteQueryService({site: this.site, onlyThisSite: true});
        dao.loadByValue('token', token, 'auth_token', function (err, tokenInfo) {
            if (_.isError(err) || !tokenInfo || tokenInfo.used) {
                return cb(err, false);
            }

            tokenInfo.used = true;
            self.saveToken(tokenInfo, function (err, result) {
                if (_.isError(err)) {
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
    }

    /**
     * Saves token object
     *
     * @method saveToken
     * @param {Object} tokenInfo - the token object to save
     * @param {Function} cb
     */
    saveToken(tokenInfo, cb) {
        var doc = tokenInfo;
        doc.object_type = 'auth_token';
        var dao = new SiteQueryService(this.site, false);
        dao.save(doc, function (err, result) {
            if (_.isError(err)) {
                return cb(err, null);
            }
            cb(null, result);
        });
    }
}

//exports
module.exports = TokenService;
