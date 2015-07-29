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
var util = require('../../util.js');

module.exports = function AuthenticationModule(pb) {
    
    /**
     *
     * @class UsernamePasswordAuthentication
     * @constructor
     */
    function UsernamePasswordAuthentication() {}
    
    /**
     *
     * @method authenticate
     * @param {Object} credentials
     * @param {String} credentials.username
     * @param {String} credentials.password
     * @param {Function} cb
     */
    UsernamePasswordAuthentication.prototype.authenticate = function(credentials, cb) {
        if (!util.isObject(credentials) || !util.isString(credentials.username) || !util.isString(credentials.password)) {
            return cb(new Error("UsernamePasswordAuthentication: The username and password must be passed as part of the credentials object: "+credentials), null);
        }

        //build query
        var query = {
            object_type : 'user',
            '$or' : [
                {
                    username : credentials.username
                },
                {
                    email : credentials.username
                }
            ],
            password : credentials.password
        };

        //check for required access level
        if (!isNaN(credentials.access_level)) {
            query.admin = {
                '$gte': credentials.access_level
            };
        }

        var dao;
        if (credentials.hasOwnProperty('site')) {
            dao = new pb.SiteQueryService(credentials.site, false);
        } else {
            dao = new pb.DAO();
        }
        //search for user
        dao.loadByValues(query, 'user', cb);
    };

    /**
     *
     * @class FormAuthentication
     * @constructor
     * @extends UsernamePasswordAuthentication
     */
    function FormAuthentication() {}
    util.inherits(FormAuthentication, UsernamePasswordAuthentication);
    
    /**
     * @method authenticate
     */
    FormAuthentication.prototype.authenticate = function(postObj, cb) {
        if (!util.isObject(postObj)) {
            return cb(new Error("FormAuthentication: The postObj parameter must be an object: "+postObj), null);
        }

        //call the parent function
        var userDocument = pb.DocumentCreator.create('user', postObj);
        FormAuthentication.super_.prototype.authenticate.apply(this, [userDocument, cb]);
    };

    /**
     *
     * @class TokenAuthentication
     * @constructor
     */
    function TokenAuthentication(options) {
        this.options = options;
    }

    /**
     * @method authenticate
     */
    TokenAuthentication.prototype.authenticate = function(token, cb) {
        var tokenService = new pb.TokenService(this.options);
        tokenService.validateUserToken(token, function(err, result) {
            if(util.isError(err)) {
                return cb(err, null);
            }

            if(!result.tokenInfo || !result.valid || !result.tokenInfo.user) {
                return cb();
            }

            var dao = new pb.DAO();
            dao.loadById(result.tokenInfo.user, 'user', cb);
        });
    };

    //exports
    return {
        UsernamePasswordAuthentication: UsernamePasswordAuthentication,
        FormAuthentication: FormAuthentication,
        TokenAuthentication: TokenAuthentication
    };
};
