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
    openSession: async (ctx, next) => {
        //Setup key deletion
        ctx.session._toDelete = [];
        ctx.session.delete = function (key) {
            delete this[key];
            this._toDelete.push(key);
        };
        await next();
    },
    closeSession: async (ctx, next) => {
        //close session after data sent
        //public content doesn't require a session so in order to not error out we
        //check if the session exists first.
        // if (!ctx.session) {
        //     return;
        // }
        await next();
        // const mergeFn = (cachedSession) => mergeSession(cachedSession, ctx.session);
        // try {
        //     await util.promisify(pb.session.merge).call(pb.session, ctx.session.uid, mergeFn)
        // } catch (_err) {
        //     pb.log.warn(`RequestHandler: Failed to close session [${req.session.uid}]`)
        // }
    }
});
