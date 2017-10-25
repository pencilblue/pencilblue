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

        initialize() {

            return this._getDetails().then(details => {
                const mainModule = this._loadMainModule(details);
                let pluginSpec = this._mainModuleHandler(mainModule, details);
                return this._onStartup(pluginSpec.main_module)
                    .then(_ => this._loadServices())
                    .then(services => pluginSpec.services = services)
                    .then(_ => this._loadControllers())
                    .then(controllers => {
                        pluginSpec.controllers = controllers
                        return pluginSpec;
                    });
            });



            const tasks = [
                this._getDetails,
                this._mainModuleHandler,
                this._onStartup,
                this._loadServices,
                this._loadControllers
            ];
            //
            // // return Promise.each(tasks).then(_ => this.pluginSpec);
            //
            //
            // return Promise.reduce(tasks, task => task.bind(this)()).then(_ => this.pluginSpec);
        }

        _loadMainModule(details) {
            try {
                return require(path.join(PLUGINS_DIR, this.pluginuid, details.main_module.path));
            }
            catch (e) {
                return null;
            }
        }


        // Platform Wide Tasks (Only need to run once)
        _getDetails() {
            const filePath = path.join(PLUGINS_DIR, this.pluginuid, DETAILS_FILE_NAME);;
            return fs.readFileAsync(filePath).then((data) => {
                try {
                    this.details = JSON.parse(data);
                    return this.details
                }
                catch(e) {
                    e.message = "Failed to parse json file ["+filePath+']. '+e.message;
                    e.code    = 500;
                    e.source  = e;
                    throw e;
                }
            });
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
                icon: details.icon ? pb.UrlService.urlJoin('/public', this.pluginuid, deatils.icon) : null
            };
        }
        //TODO: Will take care of these last
        // validationErrors() {
        //
        // }
        //
        // validationOutput() {
        //
        // }
        //
        // uidCheck() {
        //
        // }
        //
        // npmDependencyCheck() {
        //
        // }
        //
        // bowerDependencyCheck() {
        //
        // }
        //
        // versionCheck() {
        //
        // }

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
            return Promise.promisify(loader.getAll, {context: loader})({});
        }

    }
    return PluginInitializationService
}




