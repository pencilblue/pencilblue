module.exports = function(pb) {
    class LogoutController extends pb.BaseController {
        async render (cb) {
            let redirectUrl = this.redirectLink;
            this.session.authentication = {};
            return this.redirect(redirectUrl, cb);
        }
        get redirectLink () {
            // It is a security concern to redirect an non-admin to an admin route.  Send them to the admin login page
            if (pb.SecurityService.isAuthorized(this.session, { admin_level: pb.SecurityService.ACCESS_WRITER })) {
                return '/admin/login';
            }

            //check for a valid referer
            let redirect = this.req.headers.referer;
            if (!pb.util.isNullOrUndefined(redirect)) {
                return redirect;
            }

            //when all else fails, go to the home page
            return '/';
        }
    }

    //exports
    return LogoutController;
};
