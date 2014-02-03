// Retrieve the header, body, and footer and return them to the router
this.init = function(request, output)
{
    var result = '';
    
    getSession(request, function(session)
    {
        if(userIsAuthorized(session, {logged_in: true, admin_level: ACCESS_WRITER}))
        {
            output({redirect: pb.config.siteRoot + '/admin'});
            return;
        }
        else if(userIsAuthorized(session, {logged_in: true}))
        {
            output({redirect: pb.config.siteRoot});
            return;
        }
    
        initLocalization(request, session, function(data)
        {
            getHTMLTemplate('admin/login', 'Login', null, function(data)
            {
                result = result.concat(data);
                
                displayErrorOrSuccess(session, result, function(newSession, newResult)
                {
                    session = newSession;
                    result = newResult;
                
                    editSession(request, session, [], function(data)
                    {
                        output({cookie: getSessionCookie(session), content: localize(['login'], result)});
                    });
                });
            });
        });
    });
};

function Login(){}

//inheritance 
util.inherits(Login, pb.BaseController);


Login.prototype.render = function(cb) {

    
    if(pb.security.isAuthorized(this.session, {authenticated: true, admin_level: ACCESS_WRITER})) {
        cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin'));
        return;
    }
    else if(pb.security.isAuthenticated(this.session)) {
        cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot));
        return;
    }

    var self = this;
    pb.templates.load('admin/login', 'Login', null, function(data) {

        self.displayErrorOrSuccess(data, function(result) {
        	var content = self.localizationService.localize(['login'], result);
        	cb({content: content});
        });
    });
};

//exports
module.exports = Login;