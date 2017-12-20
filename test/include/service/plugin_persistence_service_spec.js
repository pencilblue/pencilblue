const TestHelper = require('../../test_helpers');
const should = require('should');
const sinon = require('sinon');
const Promise = require('bluebird');

describe('PluginPersistenceService', () => {
    let pb;

    TestHelper.registerReset(lib => pb = lib);
    const sandbox = TestHelper.registerSandbox();
    const PLUGIN_ID = 'some-plugin', SITE_ID = 'some-site';
    const dbObj = {objectToBeSaved: true};

    beforeEach(() => {
        sandbox.stub(pb.PluginService, 'getPluginSpec')
            .withArgs(PLUGIN_ID)
            .returns({details: {}});
        sandbox.stub(pb.DocumentCreator, 'create')
            .withArgs('plugin', sinon.match.any)
            .returns(dbObj);
        sandbox.stub(pb.DAO.prototype, 'save')
            .withArgs(dbObj)
            .returns(Promise.resolve(true));

    });

    it('should be able to persist a given plugin and site', () => {
        let instance = new pb.PluginPersistenceService();
        return instance.persist(PLUGIN_ID, null, SITE_ID)
            .then(() => {

            });
    });
});
