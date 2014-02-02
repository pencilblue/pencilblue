// Retrieve the header, body, and footer and return them to the router
function Setup(){}

Setup.init = function(request, output) {
    var result = '';
    
    getSession(request, function(session) {
    	pb.templates.load('setup', 'Setup', null, function(data) {
            result = result.concat(data);
            
            displayErrorOrSuccess(session, result, function(newSession, newResult) {
                session = newSession;
                result = newResult;
            
                editSession(request, session, [], function(data) {
                    output({cookie: getSessionCookie(session), content: localize(['setup', 'users'], result)});
                });
            });
        });
    });
};

Setup.prototype.init = function(props, cb) {
	this.session             = props.session;
	this.localizationService = props.localization_service;
	cb();
};

Setup.prototype.render = function(cb) {
	var self = this;
	pb.templates.load('setup', 'Setup', null, function(data) {
        var result = data;
        
        displayErrorOrSuccess(self.session, result, function(newSession, newResult) {
            result = newResult;
        
            var sets    = ['setup', 'users'];
            var content = self.localizationService.localize(sets, result);
            cb({content: content});
        });
    });
};

//exports
module.exports = Setup;
