const {expect, sinon} = require('../../helpers/spec_helper');
const pb = require('../../helpers/pb_stub')();

const SessionHandler = require('../../../include/session/session')(pb);

describe('when using the SessionHandler', () => {

    let sessionHandler;
    let sessionStore;
    beforeEach(() => {
        sessionStore = {
            start: sinon.stub(),
            get: sinon.stub(),
            clear: sinon.stub(),
            set: sinon.stub(),
            lock: sinon.stub(),
            shutdown: sinon.stub()
        };
        sessionHandler = new SessionHandler({});
    });
    describe('constants', () => {
        let path = require('path');
        it('should have some predefined constants', () => {
            expect(SessionHandler.HANDLER_PATH).to.equal(path.join(pb.config.docRoot, 'include', 'session', 'storage', path.sep));
            expect(SessionHandler.HANDLER_SUFFIX).to.equal('_session_store.js');
            expect(SessionHandler.SID_KEY).to.equal('uid');
            expect(SessionHandler.TIMEOUT_KEY).to.equal('timeout');
            expect(SessionHandler.COOKIE_HEADER).to.equal('parsed_cookies');
            expect(SessionHandler.COOKIE_NAME).to.equal('cms_tn_session_id');
        })
    })

    describe('to start and stop sessions', () => {
        it('should have an end function that sets that flag to true', (done) => {
            let session = {};
            expect(!!session.end).to.equal(false);
            sessionHandler.end(session, () => {
                expect(session.end).to.equal(true);
                done();
            });
        });
        it('should have a start function that starts the session store', (done) => {
            sessionHandler.sessionStore = {start: sinon.stub().yields()};

            sessionHandler.start(() => {
                expect(sessionHandler.sessionStore.start.calledOnce).to.equal(true);
                done();
            });
        });
        it('should have a shutdown function that shuts down the session store', (done) => {
            sessionHandler.sessionStore = {shutdown: sinon.stub().yields()};

            sessionHandler.shutdown(() => {
                expect(sessionHandler.sessionStore.shutdown.calledOnce).to.equal(true);
                done();
            });
        });
    });

    describe('to get the remotes IP', () => {
        let req;
        beforeEach(() => {
           req = {
               headers : {},
               connection: {
                   remoteAddress: 'Remote IP Address'
               }
           };
        });
        it('should check for x-forwarded-for header', () => {
            req.headers['x-forwarded-for'] = 'ip-address-1, ip address 2';
            let ip = SessionHandler.getRemoteIP(req);

            expect(ip).to.equal('ip-address-1');
        });
        it('should just return the remote address if the x-forwarded-for header is not set', () => {
            let ip = SessionHandler.getRemoteIP(req);

            expect(ip).to.equal('Remote IP Address');
        });
    });
    describe('to get a session instance', () => {
        let getSessionStoreStub;
        before(() => {
            getSessionStoreStub = sinon.stub(SessionHandler, 'getSessionStore', sinon.stub().returns(sinon.stub()));
        });
        after(() => {
            getSessionStoreStub.restore();
        });

        it('should call get session store and instantiate that instance', () => {
            let instance = SessionHandler.getSessionStoreInstance();
            expect(instance).to.exist;
            expect(SessionHandler.getSessionStore.calledOnce).to.equal(true);
        });
    });

    describe('to get the session id from the cookie', () => {
        let req = {};
        beforeEach(() => {
            req = {
                headers: {
                    [SessionHandler.COOKIE_HEADER]: {}
                }
            };
        });
        it('should return null, if the headers do not have a a cookie at all', () => {
            // Test Run
            let sessionId = SessionHandler.getSessionIdFromCookie({headers: {}});

            // Expectations
            expect(sessionId).to.equal(null);
        });
        it('should return null, if the headers has a cookie, but neither session_id', () => {
            // Test Run
            let sessionId = SessionHandler.getSessionIdFromCookie(req);

            // Expectations
            expect(sessionId).to.equal(null);
        });

        it('should get the id from session_id if the cms_tn_session_id is not present', () => {
            // Setup
            req.headers[SessionHandler.COOKIE_HEADER] = {
                session_id: 'the session id',
                other_cookie: 'some other value'
            };

            // Test Run
            let sessionId = SessionHandler.getSessionIdFromCookie(req);

            // Expectations
            expect(sessionId).to.equal('the session id');
        });
        it('should get the id from cms_tn_session_id even if the session_id is present', () => {
            // Setup
            req.headers[SessionHandler.COOKIE_HEADER] = {
                cms_tn_session_id: 'the CMS session id',
                session_id: 'the session id',
                other_cookie: 'some other value'
            };

            // Test Run
            let sessionId = SessionHandler.getSessionIdFromCookie(req);

            // Expectations
            expect(sessionId).to.equal('the CMS session id');
        });
    });

    describe('to get a session cookie', () => {
        it('should form a set cookie response based on session uid', () => {
            let sessionCookie = SessionHandler.getSessionCookie({uid: 'the session uid'});

            expect(sessionCookie).to.exist;
            expect(sessionCookie[SessionHandler.COOKIE_NAME]).to.equal('the session uid');
            expect(sessionCookie.path).to.equal('/');
        });
    });
});
