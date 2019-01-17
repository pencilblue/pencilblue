const Promise = require('bluebird');
const fs = require('fs');
const path = require('path');

Promise.promisifyAll(fs);

module.exports = (pb) => {
    const DETAILS_FILE_NAME = 'details.json';
    const PLUGINS_DIR = path.join(pb.config.plugins.directory);
    const PUBLIC_DIR_NAME = 'public';
    const util = pb.util;

    class PluginInitializationService {
        constructor (pluginuid) {
            this.pluginuid = pluginuid;
        }

        static handleInitializationError (pluginuid, err) {
            //log it all
            var hasValidationErrs = !!err.validationErrors;
            pb.log.error('PluginInitializationService:[%s] failed to initialize: %s', pluginuid, hasValidationErrs ? err.message : err.stack);
            if (hasValidationErrs) {
                err.validationErrors.forEach(function(validationError) {
                    pb.log.error('PluginInitializationService:[%s] details.json validation error FIELD=%s MSG=%s', pluginuid, validationError.field, validationError.message);
                });
            }
        }

        initialize() {
            return this._getDetails()
                .then(details => this._validate(details))
                .then(details => this._initTasks(details));
        }

        _initTasks(details) {
            const mainModule = this._loadMainModule(details);
            let pluginSpec = this._mainModuleHandler(mainModule, details);
            pluginSpec.uid = this.pluginuid;
            pluginSpec.details = details;

            return this._onStartup(pluginSpec.main_module)
                .then(_ => this._loadServices())
                .then(services => pluginSpec.services = services)
                .then(_ => this._loadControllers())
                .then(controllers => {
                    pluginSpec.controllers = controllers
                    this._loadLocalization();
                    return pluginSpec;
                });
        }

        _loadMainModule(details) {
            try {
                return require(path.join(PLUGINS_DIR, this.pluginuid, details.main_module.path))(pb);
            }
            catch (e) {
                return null;
            }
        }


        // Platform Wide Tasks (Only need to run once)
        _getDetails() {
            const filePath = path.join(PLUGINS_DIR, this.pluginuid, DETAILS_FILE_NAME);;
            return fs.readFileAsync(filePath).then(JSON.parse);
        }

        _mainModuleHandler(mainModule, details) {

            let permissions = {};
            if (details.permissions) {
                Object.keys(details.permissions).forEach(role => {
                    permissions[role] = util.arrayToHash(details.permissions[role]);
                });
            }
            else {
                pb.log.debug('PluginInitializationService:[%s] Skipping permission set load. None were found.', this.pluginuid);
            }

            let templates = null;
            if (details.theme && details.theme.content_templates) {
                templates = details.theme.content_templates;
                templates.forEach(template => {
                    template.theme_name = details.name;
                });
            }

            return {
                main_module: mainModule,
                public_dir: path.join(PLUGINS_DIR, this.pluginuid, PUBLIC_DIR_NAME),
                permissions,
                templates,
                icon: details.icon ? pb.UrlService.urlJoin('/public', this.pluginuid, details.icon) : null
            };
        }

        _onStartup(mainModule) {
            if (mainModule && util.isFunction(mainModule.onStartup)) {
                return Promise.promisify(mainModule.onStartup, { context: mainModule })();
            }
            pb.log.debug('PluginInitializationService:[%s] No main module onStartup function found.', this.pluginuid);
            return Promise.resolve(true);
        }

        _loadServices() {
            let loader = new pb.PluginServiceLoader({ pluginUid: this.pluginuid });
            return Promise.promisify(loader.getAll, {context: loader})({});
        }

        _loadControllers() {
            let loader = new pb.PluginControllerLoader({ pluginUid: this.pluginuid });
            return Promise.promisify(loader.getAll, { context: loader })({register: true});
        }

        _validate(details) {
            const validationService = new pb.PluginValidationService({});
            return Promise.promisify(validationService.validate, { context: validationService })(details, {})
                .then(result => this._handleValidationErrors(result))
                .then(_ => details);
        }
        _handleValidationErrors(result) {
            if (result.validationErrors && result.validationErrors.length) {
                const err = new Error(`Failed to validate details for plugin ${this.pluginuid}\n ${JSON.stringify(result.validationErrors, null, 2)}`);
                err.validationErrors = result.validationErrors;
                PluginInitializationService.handleInitializationError(this.pluginuid, err);
            }
            return Promise.resolve(result);
        }

        _loadLocalization () {
            const service = new pb.PluginLocalizationLoader({ pluginUid: this.pluginuid, site: this.site });
            return Promise.promisify(service.getAll, { context: service })({register: true});
        }
    }
    return PluginInitializationService
}




