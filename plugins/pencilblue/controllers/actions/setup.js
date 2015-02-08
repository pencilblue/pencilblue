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

//dependencies
var async           = require('async');
var CallHomeService = pb.CallHomeService;

/**
 * Creates the initial admin user
 */
function Setup(){}

//inheritance
util.inherits(Setup, pb.BaseController);


Setup.prototype.render = function(cb) {

	var self = this;
    pb.settings.get('system_initialized', function(err, isSetup){
    	if (util.isError(err)) {
            self.reqHandler.serveError(err);
            return;
    	}

    	//when user count is 1 or higher the system has already been initialized
    	if (isSetup) {
    		self.redirect('/', cb);
    		return;
    	}

    	self.doSetup(cb);
    });
};

Setup.prototype.doSetup = function(cb) {

	var self = this;
	this.getPostParams(function(err, post){
		if (util.isError(err)) {
			self.reqHandler.serveError(err);
            return;
		}

		self.onPostParamsRetrieved(post, cb);
	});
};

Setup.prototype.onPostParamsRetrieved = function(post, cb) {
	var self = this;

	var reqParams = ['username', 'email', 'password', 'confirm_password', 'call_home'];
	var message   = this.hasRequiredParams(post, reqParams);
	if(message) {
        this.formError(message, '/setup', cb);
        return;
    }

    //set the access level (role)
    post.admin = 4;

    //get call home allowance
    var callHome = 1 == post.call_home;
    delete post.call_home;

    //do setup events
    async.series(
		[
			function(callback) {
				var userDocument = pb.DocumentCreator.create('user', post);

				var dao = new pb.DAO();
				dao.save(userDocument, callback);
			},
			function(callback) {
				pb.settings.set('active_theme',
				pb.RequestHandler.DEFAULT_THEME, callback);
			},
			function(callback) {
                //Do nothing here because it calls set under the covers.  
                //We assume it does what it is supposed to.  Attempting to 
                //set the settings again will only cause a failure due to a 
                //duplicate key
                var contentService = new pb.ContentService();
                contentService.getSettings(callback);
			},
			function(callback) {
				pb.settings.set('system_initialized', true, callback);
			},
            function(callback) {
                pb.settings.set('call_home', callHome, callback);
            },
            function(callback) {
                if (callHome) {
                    CallHomeService.callHome(CallHomeService.SYSTEM_SETUP_EVENT);
                }
                callback(null, null);
            }
		],
        function(err, results){
    		if (util.isError(err)) {
                pb.log.error('An error occurred while attempting to perform setup: %s', err.stack || err.message);
    			return self.formError(self.ls.get('ERROR_SAVING'), '/setup', cb);
    		}

    		self.session.success = self.ls.get('READY_TO_USE');
    		self.redirect('/admin/login', cb);
		}
    );
};

//exports
module.exports = Setup;
