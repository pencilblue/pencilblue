const Cookies = require('cookies');
const util = require('util');
const _ = require('lodash');

const mergeSession = (cachedSession, newSession) => {
    cachedSession = cachedSession || {};
    let toDelete = newSession._toDelete || [];
    delete newSession._toDelete;
    delete newSession.delete;
    _.merge(cachedSession, newSession)
    toDelete.forEach(key => {
        if (!['uid', 'client_id'].includes(key)) {
            delete cachedSession[key];
        }
    });
    return cachedSession;
};

module.exports = pb => ({
    openSession: async (req, res) => {
        //check for session cookie
        var cookies = pb.RequestHandler.parseCookies(req);
        req.headers[pb.SessionHandler.COOKIE_HEADER] = cookies;

        //open session
        const session = await util.promisify(pb.session.open).call(pb.session, req);
        if (!session) {
            throw new Error("The session object was not valid.  Unable to generate a session object based on request.")
        }

        //set the session id when no session has started or the current one has
        //expired.
        var sc = Object.keys(cookies).length === 0;
        var se = !sc && cookies[pb.SessionHandler.COOKIE_NAME] !== session.uid;
        req.handler.setSessionCookie = req.setSessionCookie = sc || se;
        if (pb.log.isSilly()) {
            pb.log.silly("RequestHandler: Session ID [%s] Cookie SID [%s] Created [%s] Expired [%s]", session.uid, cookies.session_id, sc, se);
        }

        //Setup key deletion
        session._toDelete = [];
        session.delete = function (key) {
            delete this[key];
            this._toDelete.push(key);
        };

        //continue processing
        req.handler.session = req.session = session;
    },
    closeSession: async (req, res) => {
        //close session after data sent
        //public content doesn't require a session so in order to not error out we
        //check if the session exists first.
        if (!req.session) {
            return
        }
        const mergeFn = (cachedSession) => mergeSession(cachedSession, req.session);
        try {
            await util.promisify(pb.session.merge).call(pb.session, req.session.uid, mergeFn)
        } catch (_err) {
            pb.log.warn(`RequestHandler: Failed to close session [${req.session.uid}]`)
        }
    },
    writeSessionCookie: (req, res) => {
        const cookies = new Cookies(req, res);
        if (req.setSessionCookie) {
            try {
                cookies.set(pb.SessionHandler.COOKIE_NAME, req.session.uid, pb.SessionHandler.getSessionCookie(req.session));
            }
            catch (e) {
                pb.log.error('RequestHandler: Failed to set cookie: %s', e.stack);
            }
        }
    }
})
