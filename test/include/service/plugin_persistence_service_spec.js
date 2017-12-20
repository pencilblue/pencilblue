const TestHelper = require('../../test_helpers');
const should = require('should');
const sinon = require('sinon');
const Promise = require('bluebird');
const _ = require('lodash');

describe('PluginPersistenceService', () => {
    let pb;

    TestHelper.registerReset(lib => pb = lib);
    const sandbox = TestHelper.registerSandbox();
    const PLUGIN_ID = 'some-plugin', SITE_ID = 'some-site', PATH = 'some-path';
    const dbObj = {objectToBeSaved: true};
    const mainModule = {
        onInstall: sinon.stub().yields(null, true),
    };
    const pluginDetails = {
        details: {
            main_module: {
                path: PATH
            }
        }
    };
    let getPluginSpecStub, loadMainModuleStub, saveStub, resetThemeSettingsStub;

    beforeEach(() => {
        getPluginSpecStub = sandbox.stub(pb.PluginService, 'getPluginSpec')
            .withArgs(PLUGIN_ID)
            .returns(Promise.resolve(pluginDetails));
        sandbox.stub(pb.PluginService.prototype, 'resetSettings')
            .yields(null, true);
        resetThemeSettingsStub = sandbox.stub(pb.PluginService.prototype, 'resetThemeSettings')
            .yields(null, true);
        sandbox.stub(pb.DocumentCreator, 'create')
            .withArgs('plugin', sinon.match.any)
            .returns(dbObj);
        saveStub = sandbox.stub(pb.DAO.prototype, 'save')
            .withArgs(sinon.match(x => _.isEqual(x, Object.assign({site: SITE_ID}, dbObj))))
            .yields(null, true);
        loadMainModuleStub = sandbox.stub(pb.PluginService, 'loadMainModule')
            .returns(mainModule);
    });

    it('should be able to persist a given plugin and site, and invoke the plugin\'s onInstall method', () => {
        let instance = new pb.PluginPersistenceService();
        return instance.persist(PLUGIN_ID, null, SITE_ID)
            .then(result => {
                saveStub.called.should.eql(true);
                mainModule.onInstall.called.should.eql(true);
                result.should.eql(true);
            });
    });

    it('should log persistence steps', () => {
        let logMethod = sandbox.stub();
        let instance = new pb.PluginPersistenceService(logMethod);
        return instance.persist(PLUGIN_ID, null, SITE_ID)
            .then(() => {
                logMethod.calledWith(sinon.match(x => x.includes('Loading details from plugin service')))
                    .should.eql(true);
            });
    });

    it('should default plugins to global site if none is specified', () => {
        let instance = new pb.PluginPersistenceService();
        saveStub.withArgs(sinon.match(x => _.isEqual(x, Object.assign({site: pb.PluginService.GLOBAL_SITE}, dbObj))))
            .yields(null, true);
        return instance.persist(PLUGIN_ID)
            .then(result => {
                saveStub.called.should.eql(true);
                result.should.eql(true);
            });
    });

    it('should reset theme settings if plugin has theme settings', () => {
        let themedPluginSpec = _.cloneDeep(pluginDetails);
        themedPluginSpec.details.theme = {
            settings: {}
        };
        getPluginSpecStub.returns(Promise.resolve(themedPluginSpec));
        let instance = new pb.PluginPersistenceService();
        return instance.persist(PLUGIN_ID, null, SITE_ID)
            .then(() => {
                resetThemeSettingsStub.called.should.eql(true);
            });
    });

    it('should throw error if there is no main module', () => {
        loadMainModuleStub.returns(null);
        let instance = new pb.PluginPersistenceService();
        return instance.persist(PLUGIN_ID, null, SITE_ID)
            .then(() => {
                throw new Error('this call should not resolve');
            })
            .catch(err => err.message.should.eql(`Failed to load main module ${PLUGIN_ID} at ${PATH}`));
    });

    it('should call onInstallWithContext if main module has no onInstall but has onInstallWithContext', () => {
        let withContext = {
            onInstallWithContext: sinon.stub().yields(null, true),
        };
        loadMainModuleStub.returns(withContext);
        let instance = new pb.PluginPersistenceService();
        return instance.persist(PLUGIN_ID, null, SITE_ID)
            .then(() => {
                withContext.onInstallWithContext.called.should.eql(true);
            });
    });

    it('should warn if main module has neither onInstall nor onInstallWithContext', () => {
        let noInstallModule = {};
        loadMainModuleStub.returns(noInstallModule);
        let logMethod = sandbox.stub();
        let instance = new pb.PluginPersistenceService();
        return instance.persist(PLUGIN_ID, null, SITE_ID)
            .then(() => {
                logMethod.calledWith(sinon.match(x => x.includes('did not provide an \'onInstall\'')))
            });
    });

    it('should save target settings into database', () => {
        let detailsWithSettings = _.cloneDeep(pluginDetails);
        detailsWithSettings.details.settings = [
            {
                name: 'override-setting',
                value: 'default-value',
            },
            {
                name: 'default-setting',
                value: 'default-value',
            },
        ];
        getPluginSpecStub.returns(Promise.resolve(detailsWithSettings));

        let setSettingsStub = sandbox.stub(pb.PluginService.prototype, 'setSettings')
            .yields(null, true);

        let instance = new pb.PluginPersistenceService();
        return instance.persist(PLUGIN_ID, {
            'override-setting': 'override-value',
        }, SITE_ID)
            .then(() => {
                setSettingsStub.calledWith(sinon.match(x => _.isEqual(x, [
                    {
                        name: 'override-setting',
                        value: 'override-value',
                    },
                    {
                        name: 'default-setting',
                        value: 'default-value',
                    },
                ])))
            });

    });

});
