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

//exports
module.exports = Setup;
