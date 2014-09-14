/*
    Copyright (C) 2014  PencilBlue, LLC

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

/**
 * Service for performing user specific operations.
 *
 * @module Services
 * @submodule Entities
 * @class UserService
 * @constructor
 */
function UserService(){}

/**
 * Gets the full name of a user
 *
 * @method getFullName
 * @param {String}   userId The object Id of the user
 * @param {Function} cb     Callback function
 */
UserService.prototype.getFullName = function(userId, cb) {
    if (!pb.validation.isId(userId, true)) {
        return cb(new Error('The userId parameter must be a valid ID value'));
    }
    
	var self = this;
	var dao  = new pb.DAO();
	dao.loadById(userId, 'user', function(err, author){
		if (util.isError(err)) {
			callback(err, null);
			return;
		}

		cb(null, self.getFormattedName(author));
	});
};

/**
 * Takes the specified user object and formats the first and last name.
 * @static
 * @method getFormattedName
 * @param {Object} user The user object to extract a name for.
 * @return {String} The user's full name
 */
UserService.prototype.getFormattedName = function(user) {
	var name = user.username;
	if (user.first_name) {
		name = user.first_name + ' ' + user.last_name;
	}
	return name;
};

/**
 * Gets the full names for the supplied authors
 *
 * @method getAuthors
 * @param {Array}   objArry An array of user object
 * @param {Function} cb     Callback function
 */
UserService.prototype.getAuthors = function(objArry, cb){
	var self  = this;
	var tasks = pb.utils.getTasks(objArry, function(objArry, index){
    	return function(callback) {
    		self.getFullName(objArry[index].author, function(err, fullName){
    			objArry[index].author_name = fullName;
    			callback(err, objArry[index]);
    		});
    	};
    });
    async.parallelLimit(tasks, 3, cb);
};

/**
 * Retrieves the available access privileges to assign to a user
 *
 * @method getAdminOptions
 * @param {Object} session The current session object
 * @param {Object} ls      The localization object
 */
UserService.prototype.getAdminOptions = function(session, ls) {
	var adminOptions = [
        {name: ls.get('READER'), value: ACCESS_USER},
        {name: ls.get('WRITER'), value: ACCESS_WRITER},
        {name: ls.get('EDITOR'), value: ACCESS_EDITOR}
    ];

    if(session.authentication.user.admin >= ACCESS_MANAGING_EDITOR) {
        adminOptions.push({name: ls.get('MANAGING_EDITOR'), value: ACCESS_MANAGING_EDITOR});
    }
    if(session.authentication.user.admin >= ACCESS_ADMINISTRATOR) {
        adminOptions.push({name: ls.get('ADMINISTRATOR'), value: ACCESS_ADMINISTRATOR});
    }

    return adminOptions;
};

/**
 * Retrieves a select list (id/name) of available system editors
 * @method getEditorSelectList
 * @param {String} currId The Id to be excluded from the list.  
 * @param {Function} cb A callback that takes two parameters.  The first is an 
 * error, if exists, the second is an array of objects that represent the 
 * editor select list.
 */
UserService.prototype.getEditorSelectList = function(currId, cb) {
	var where = {
		admin: {
			$gt: ACCESS_WRITER
		}
	};
	var select = {
		_id: 1,
		first_name: 1,
		last_name: 1
	};
    var dao     = new pb.DAO();
	dao.query('user', where, select).then(function(data){
        if (util.isError(data)) {
        	cb(data, null);
        	return;
        }

		var editors = [];
		for(var i = 0; i < data.length; i++) {

			var editor = {_id: data[i]._id, name: data[i].first_name + ' ' + data[i].last_name};
            if(currId == data[i]._id.toString()) {
                editor.selected = 'selected';
            }
            editors.push(editor);
        }
        cb(null, editors);
    });
};

/**
 * Sends a verification email to an unverified user
 *
 * @method sendVerificationEmail
 * @param {Object}   user A user object
 * @param {Function} cb   Callback function
 */
UserService.prototype.sendVerificationEmail = function(user, cb) {
	cb = cb || pb.utils.cb;

	// We need to see if email settings have been saved with verification content
	var options;
	pb.email.getSettings(function(err, emailSettings) {
		options = {
			to: user.email,
			replacements: {
				'verification_url': pb.config.siteRoot + '/actions/user/verify_email?email=' + user.email + '&code=' + user.verification_code,
				'first_name': user.first_name,
				'last_name': user.last_name
			}
		};
		if(emailSettings.layout) {
			options.subject= emailSettings.verification_subject;
			options.layout = emailSettings.verification_content;
			pb.email.sendFromLayout(options, cb);
		}
		else {
			options.subject = pb.config.siteName + ' Account Confirmation';
			options.template = emailSettings.template;
			pb.email.sendFromTemplate(options, cb);
		}
	});
};

/**
 * Sends a password reset email to a user
 *
 * @method sendPasswordResetEmail
 * @param {Object}   user          A user object
 * @param {Object}   passwordReset A password reset object containing the verification code
 * @param {Function} cb            Callback function
 */
UserService.prototype.sendPasswordResetEmail = function(user, passwordReset, cb) {
	cb = cb || pb.utils.cb;

    var verficationUrl = pb.UrlService.urlJoin(pb.config.siteRoot, '/actions/user/reset_password') + util.format('?email=%s&code=%s', encodeURIComponent(user.email), encodeURIComponent(passwordReset.verification_code));
	var options = {
		to: user.email,
		subject: pb.config.siteName + ' Password Reset',
		template: 'admin/elements/password_reset_email',
		replacements: {
			'verification_url': verficationUrl,
			'first_name': user.first_name,
			'last_name': user.last_name
		}
	};
	pb.email.sendFromTemplate(options, cb);
};

/**
 * Checks to see if a proposed user name or email is already in the system
 *
 * @method isUserNameOrEmailTaken
 * @param {String}   username
 * @param {String}   email
 * @param {String}   id       User object Id to exclude from the search
 * @param {Function} cb       Callback function
 */
UserService.prototype.isUserNameOrEmailTaken = function(username, email, id, cb) {
	this.getExistingUsernameEmailCounts(username, email, id, function(err, results) {

		var result = results === null;
		if (!result) {

			for(var key in results) {
				result |= results[key] > 0;
			}
		}
		cb(err, result);
	});
};

/**
 * Gets the total counts of a username and email in both the user and unverified_user collections
 *
 * @method getExistingUsernameEmailCounts
 * @param {String}   username
 * @param {String}   email
 * @param {String}   id       User object Id to exclude from the search
 * @param {Function} cb       Callback function
 */
UserService.prototype.getExistingUsernameEmailCounts = function(username, email, id, cb) {
    if (pb.utils.isFunction(id)) {
        cb = id;
        id = null;
    }

	var getWhere = function(where) {
		if (id) {
			where[pb.DAO.getIdField()] = {$ne: pb.DAO.getObjectID(id)};
		}
		return where;
	};
	var dao   = new pb.DAO();
	var tasks = {
		verified_username: function(callback) {
			dao.count('user', getWhere({username: username.toLowerCase()}), callback);
		},
		verified_email: function(callback) {
			dao.count('user', getWhere({email: email.toLowerCase()}), callback);
		},
		unverified_username: function(callback) {
			dao.count('unverified_user', getWhere({username: username.toLowerCase()}), callback);
		},
		unverified_email: function(callback) {
			dao.count('unverified_user', getWhere({email: email.toLowerCase()}), callback);
		},
	};
	async.series(tasks, cb);
};

/**
 * Retrieves users by their access level (role)
 * @method findByAccessLevel
 * @param {Integer} level The admin level of the users to find
 * @param {Object} [options] The search options
 * @param {Object} [options.select={}] The fields to return
 * @param {Array} [options.orderBy] The order to return the results in
 * @param {Integer} [options.limit] The maximum number of results to return
 * @param {offset} [options.offset=0] The number of results to skip before 
 * returning results.
 * @param {Function} cb A callback that takes two parameters: an error, if 
 * occurred, and the second is an array of User objects.
 */
UserService.prototype.findByAccessLevel = function(level, options, cb) {
    if (pb.utils.isFunction(options)) {
        cb      = options;
        options = {};
    }
    else if (!pb.utils.isObject(options)) {
        throw new Error('The options parameter must be an object');
    }

    var where = {
        admin: level
    };
    var dao = new pb.DAO();
    dao.query('user', where, options.select, options.orderBy, options.limit, options.offset).then(function(result) {
        cb(util.isError(result) ? result : null, result);
    });
};

/**
 * Verifies if a user has the provided access level or higher
 *
 * @method hasAccessLevel
 * @param {String}   uid         The user's object Id
 * @param {Number}   accessLevel The access level to test against
 * @param {Function} cb          Callback function
 */
UserService.prototype.hasAccessLevel = function(uid, accessLevel, cb) {
	var where = pb.DAO.getIDWhere(uid);
	where.admin = {$gte: accessLevel};
	var dao = new pb.DAO();
	dao.count('user', where, function(err, count) {
		cb(err, count === 1);
	});
};

//exports
module.exports.UserService = UserService;
