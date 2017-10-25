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
            const tasks = [
                this._getDetails,
                this._mainModuleHandler,
                this._onStartup,
                this._loadServices,
                this._loadControllers
            ];

            // return Promise.each(tasks).then(_ => this.pluginSpec);


            return Promise.reduce(tasks, task => task.bind(this)()).then(_ => this.pluginSpec);
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

        _mainModuleHandler() {
            if (!this._loadMainModule()) {
                return Promise.reject(new Error('Failed to load main module for plugin '+this.pluginuid+' at '+ this.details.main_module.path));
            }

            let permissions = {};
            if (this.details.permissions) {
                Object.keys(this.details.permissions).forEach(role => {
                    permissions[role] = util.arrayToHash(this.details.permissions[role]);
                });
            }
            else {
                pb.log.debug('PluginInitializationService:[%s] Skipping permission set load. None were found.', this.pluginuid);
            }

            let templates = null;
            if (this.details.theme && this.details.theme.content_templates) {
                templates = this.details.theme.content_templates;
                templates.forEach(template => {
                    template.theme_name = this.details.name;
                });
            }

            this.pluginSpec = {
                main_module: this.mainModule,
                public_dir: path.join(PLUGINS_DIR, this.pluginuid, PUBLIC_DIR_NAME),
                permissions,
                templates,
                icon: this.details.icon ? pb.UrlService.urlJoin('/public', this.pluginuid, this.deatils.icon) : null
            };

            return Promise.resolve(this.pluginSpec);
        }

        _loadMainModule() {
            const pluginMM = path.join(PLUGINS_DIR, this.pluginuid, this.details.main_module.path);
            const paths = [pluginMM, this.details.main_module.path];
            for (let path of paths) {
                try {
                    this.mainModule = require(path)(pb);
                    break;
                }
                catch(e) {
                    pb.log.warn('PluginService: Failed to load main module at %s: %s', paths, e.stack);
                }
            }

            this.mainModule;
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

        _onStartup() {
            if (util.isFunction(this.mainModule.onStartup)) {
                return Promise.promisify(this.mainModule.onStartup, { context: this.mainModule })();
            }
            pb.log.debug('PluginInitializationService:[%s] No main module onStartup function found.', this.pluginuid);
            return Promise.resolve(true);
        }

        _loadServices() {
            let loader = new pb.PluginServiceLoader({ pluginUid: this.pluginuid });
            return Promise.promisify(loader.getAll, {context: loader})({})
                .then(services => {
                    this.pluginSpec.services = services;
                    return services;
                });
        }

        _loadControllers() {
            let loader = new pb.PluginControllerLoader({ pluginUid: this.pluginuid });
            return Promise.promisify(loader.getAll, {context: loader})({})
                .then(controllers => {
                    this.pluginSpec.controllers = controllers;
                    return controllers;
                });
        }

    }
    return PluginInitializationService
}




