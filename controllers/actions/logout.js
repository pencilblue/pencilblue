this.init = function(request, output)
{
    var instance = this;
 
    getSession(request, function(session)
    {
        delete session.user;
        editSession(request, session, [], function(data)
        {
            output({redirect: pb.config.siteRoot});
        });
    });
};
