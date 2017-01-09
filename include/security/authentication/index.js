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
var DAO = require('../../dao/dao');
var util = require('../../util.js');
var RegExpUtils = require('../../utils/reg_exp_utils');
var SecurityService = require('../../access_management');
var SiteQueryService = require('../../service/entities/site_query_service');

module.exports = function AuthenticationModule(pb) {

    /**
     *
     */
    class UsernamePasswordAuthentication {

        /**
         *
         * @method authenticate
         * @param {Object} credentials
         * @param {String} credentials.username
         * @param {String} credentials.password
         * @param {Function} cb
         */
        authenticate(credentials, cb) {
            if (!_.isObject(credentials) || !_.isString(credentials.username) || !_.isString(credentials.password)) {
                return cb(new Error("UsernamePasswordAuthentication: The username and password must be passed as part of the credentials object: " + credentials), null);
            }

            //build query
            var usernameSearchExp = RegExpUtils.getCaseInsensitiveExact(credentials.username);
            var query = {
                object_type: 'user',
                '$or': [
                    {
                        username: usernameSearchExp
                    },
                    {
                        email: usernameSearchExp
                    }
                ],
                password: credentials.password
            };

            //check for required access level
            if (!isNaN(credentials.access_level)) {
                query.admin = {
                    '$gte': credentials.access_level
                };
            }

            var dao;
            if (credentials.site) {
                dao = new SiteQueryService({site: credentials.site, onlyThisSite: false});
            } else {
                dao = new DAO();
            }
            //search for user
            dao.loadByValues(query, 'user', cb);
        }
    }

    /**
     *
     * @class FormAuthentication
     * @constructor
     * @extends UsernamePasswordAuthentication
     */
    class FormAuthentication extends UsernamePasswordAuthentication {

        /**
         * @method authenticate
         * @param {Object} postObj
         * @param {String} postObj.username
         * @param {String} postObj.password
         * @param {Function} cb
         */
        authenticate(postObj, cb) {
            if (!_.isObject(postObj)) {
                return cb(new Error("FormAuthentication: The postObj parameter must be an object: " + postObj), null);
            }

            if (postObj.password) {
                postObj.password = SecurityService.encrypt(postObj.password);
            }
            super.authenticate(postObj, cb);
        }
    }

    /**
     *
     * @class TokenAuthentication
     * @constructor
     * @param {Object} options
     * @param {String} options.site - site uid
     * @param {String} options.user - user id
     */
    class TokenAuthentication {
        constructor(options) {
            this.options = options;
            this.tokenService = new TokenService(options);
            this.userService = new pb.UserService(options);
        }

        /**
         * @method authenticate
         * @param {String} token
         * @param {Function} cb
         */
        authenticate(token, cb) {
            var self = this;
            this.tokenService.validateUserToken(token, function (err, result) {
                if (_.isError(err)) {
                    return cb(err, null);
                }

                if (!result.tokenInfo || !result.valid || !result.tokenInfo.user) {
                    return cb();
                }
                self.userService.get(result.tokenInfo.user, cb);
            });
        }
    }

    //exports
    return {
        UsernamePasswordAuthentication: UsernamePasswordAuthentication,
        FormAuthentication: FormAuthentication,
        TokenAuthentication: TokenAuthentication
    };
};
