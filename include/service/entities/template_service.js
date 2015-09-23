/*
    Copyright (C) 2015  PencilBlue, LLC

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

//dependencies
var path        = require('path');
var async       = require('async');
var HtmlEncoder = require('htmlencode');
var util        = require('../../util.js');

module.exports = function(pb) {

    /**
     * A templating engine that provides the ability to read in file snippets and
     * call back for data based on the flags in the template file.  The instance
     * can be provided a Localization instance which will be used to perform
     * translations for localization flags are encountered.  Flags are marked in
     * html files by the pattern ^xzy^.  The values provided here are not HTML
     * encoded.  Any reserved characters must be manually encoded by any flag
     * call backs.
     *
     * @class TemplateService
     * @constructor
     * @module Services
     * @submodule Entities
     * @param {Object} [localizationService] The localization service object
     * @param {String} siteUid context site for this service
     */
    function TemplateService(opts){
        var localizationService;
        if (!opts || (opts instanceof pb.Localization)) {
            localizationService = opts;
            opts = {};
        }
        else {
            localizationService = opts.ls;
        }
        
        /**
         * @property localCallbacks
         * @type {Object}
         */
        this.localCallbacks = {
            year: (new Date()).getFullYear()
        };

        /**
         * @property localizationService
         * @type {Localization}
         */
        this.localizationService = null;
        if (localizationService) {
            this.localizationService = localizationService;
        }
        
        /**
         * @property activeTheme
         */
        this.activeTheme = opts.activeTheme;

        /**
         * The prioritized theme when selecting templates
         * @property theme
         * @type {String}
         */
        this.theme = null;

        //ensure template loader is initialized
        if (TEMPLATE_LOADER === null) {
            var objType  = 'template';
            var services = [];

            var options = {
                objType: objType,
                timeout: pb.config.templates.memory_timeout
            };

            //add in-memory service
            if (pb.config.templates.use_memory){
                services.push(new pb.MemoryEntityService(options));
            }

            //add cache service
            if (pb.config.templates.use_cache) {
                services.push(new pb.CacheEntityService(options));
            }

            //always add fs service
            services.push(new pb.TemplateEntityService());

            TEMPLATE_LOADER = new pb.SimpleLayeredService(services, 'TemplateService');
        }

        /**
         * Indicates if the data from the registered flags
         * should be reprocessed.  The value is FALSE by default.
         * @property reprocess
         * @type {Boolean}
         */
        this.reprocess = false;

        /**
         * @property unregisteredFlagTemplate
         * @type {Function}
         */
        this.unregisteredFlagHandler = null;

        /**
         * @property siteUid
         * @type {String}
         */
        this.siteUid = pb.SiteService.getCurrentSite(opts.site);
        
        /**
         * @property settingService
         * @type {SettingService}
         */
        this.settingService = pb.SettingServiceFactory.getServiceBySite(this.siteUid);

        /**
         * @property pluginService
         * @type {PluginService}
         */
        this.pluginService = new pb.PluginService({site: this.siteUid});

        this.init();
    }

    //constants
    var TEMPLATE_PREFIX         = 'tmp_';
    var TEMPLATE_PREFIX_LEN     = TEMPLATE_PREFIX.length;
    var LOCALIZATION_PREFIX     = 'loc_';
    var LOCALIZATION_PREFIX_LEN = LOCALIZATION_PREFIX.length;
    var SYSTEM_PREFIX           = 'system_';
    var SYSTEM_PREFIX_LEN       = SYSTEM_PREFIX.length;

    var TEMPLATE_LOADER = null;

    var TEMPLATE_PIECE_STATIC = 'static';
    var TEMPLATE_PIECE_FLAG   = 'flag';

    /**
     * A container that provides the mapping for global call backs.  These should
     * only be added to at the start of the application or on plugin install/update.
     *
     * @private
     * @property
     */
    var GLOBAL_CALLBACKS = {
        site_root: pb.config.siteRoot,
        site_name: pb.config.siteName,
        site_menu_logo: '/img/logo_menu.png',
        version: pb.config.version
    };

    /**
     * The default handler for unregistered flags.  It outputs the flag back out.
     * @property unregisteredFlagHandler
     * @type {Function}
     */
    TemplateService.unregisteredFlagHandler = function(flag, cb) {
        cb(null, '^'+flag+'^');
    };

    /**
     * Sets up the default flags required for the template service,
     * including the flags that were previously considered to be global but
     * now requires to be instanced with the TemplateService
     *
     * @method init
     */
    TemplateService.prototype.init = function () {
        var self = this;

        self.registerLocal('site_logo', function (err, callback) {
           self.settingService.get('site_logo', function (err, logo) {
               callback(err, logo || '/img/pb_logo.png');
           });
        });

        self.registerLocal('site_icon', function (err, callback) {
            self.pluginService.getActiveIcon(callback);
        });
    };

    /**
     * Sets the prioritized theme to use when loading templates
     *
     * @method setTheme
     * @param {string} theme The name of the theme.
     */
    TemplateService.prototype.setTheme = function(theme) {
        this.theme = theme;
    };

    /**
     * Retrieves the prioratized theme
     *
     * @method getTheme
     * @return {string} The prioritized theme to use when loading templates
     */
    TemplateService.prototype.getTheme = function() {
        return this.theme;
    };

    /**
     * When a flag is encountered that is not registered with the engine the 
     * handler is called as a fail safe.  It is expected to return a string that 
     * will be put in the place of the flag.
     *
     * @method setUnregisteredFlagHandler
     * @param {Function} unregisteredFlagHandler
     * @return {Boolean} TRUE when the handler was set, FALSE if not
     */
    TemplateService.prototype.setUnregisteredFlagHandler = function(unregisteredFlagHandler) {
        if (!util.isFunction(unregisteredFlagHandler)) {
            return false;
        }

        this.unregisteredFlagHandler = unregisteredFlagHandler;
        return true;
    };

    /**
     * When a flag is encountered that is not registered with the engine the 
     * handler is called as a fail safe unless there is a locally registered handler.  
     * It is expected to return a string that will be put in the place of the flag.
     *
     * @method setGlobalUnregisteredFlagHandler
     * @param {Function} unregisteredFlagHandler
     * @return {Boolean} TRUE when the handler was set, FALSE if not
     */
    TemplateService.setGlobalUnregisteredFlagHandler = function(unregisteredFlagHandler) {
        if (!util.isFunction(unregisteredFlagHandler)) {
            return false;
        }

        TemplateService.unregisteredFlagHandler = unregisteredFlagHandler;
        return true;
    };

    /**
     * Sets the option that when true, instructs the engine to inspect the content 
     * provided by a flag for more flags.  This is one way of providing iterative 
     * processing of items.  See the sample plugin for an example.
     * @method setReprocess
     * @param {Boolean} reprocess
     */
    TemplateService.prototype.setReprocess = function(reprocess) {
        this.reprocess = reprocess ? true : false;
    };
    
    /**
     * Retrieves the active theme.  When not provided the service retrieves it 
     * from the settings service.
     * @private
     * @method _getActiveTheme
     * @param {Function} cb
     */
    TemplateService.prototype._getActiveTheme = function(cb) {
        if (this.activeTheme) {
            return cb(null, this.activeTheme);
        }
        this.settingService.get('active_theme', cb);
    };

    /**
     * Retrieves the raw template based on a priority.  The path to the template is
     * derived from the specified relative path and the following order of
     * directories:
     * <ol>
     * <li>The theme provided by "getTheme" if not null</li>
     * <li>The globally set active_theme</li>
     * <li>Iterates over the list of active plugins looking for the template</li>
     * <li>The system template directory</li>
     * </ol>
     *
     * @method getTemplateContentsByPriority
     * @param {string} relativePath
     * @param {function} cb Callback function
     */
    TemplateService.prototype.getTemplateContentsByPriority = function(relativePath, cb) {
        var self = this;
        
        //build set of paths to search through
        var hintedTheme   = this.getTheme();
        var paths         = [];
        if (hintedTheme) {
            paths.push(TemplateService.getCustomPath(this.getTheme(), relativePath));
        }

        this._getActiveTheme(function(err, activeTheme){

            if (activeTheme !== null) {
                paths.push(TemplateService.getCustomPath(activeTheme, relativePath));
            }

            var activePlugins = self.pluginService.getActivePluginNames();
            for (var i = 0; i < activePlugins.length; i++) {
                if (hintedTheme !== activePlugins[i] && pb.config.plugins.default !== activePlugins[i]) {
                    paths.push(TemplateService.getCustomPath(activePlugins[i], relativePath));
                }
            }
            paths.push(TemplateService.getDefaultPath(relativePath));

            //iterate over paths until a valid template is found
            var i        = 0;
            var doLoop   = true;
            var template = null;
            async.whilst(
                function(){return i < paths.length && doLoop;},
                function(callback) {

                    //attempt to load template
                    TEMPLATE_LOADER.get(paths[i], function(err, templateData){
                        template = templateData;
                        doLoop   = util.isError(err) || !util.isObject(template);
                        i++;
                        callback();
                    });
                },
                function(err) {
                    cb(err, template);
                }
            );
        });
    };

    /**
     * Loads a template file along with any encountered sub-template files and
     * processes any flags.  The call back provides any error encountered and a
     * second parameter that is the transformed content.
     *
     * @method load
     * @param {string}   templateLocation The relative location of the template file.
     * @param {function} cb               Callback function
     */
    TemplateService.prototype.load = function(templateLocation, cb) {
        if (!util.isFunction(cb)) {
            throw new Error('cb parameter must be a function');
        }
        
        var self = this;
        this.getTemplateContentsByPriority(templateLocation, function(err, templateContents) {
            if (util.isError(err)) {
                return cb(err, null);
            }
            else if (!templateContents) {
                return cb(new Error('Failed to find a matching template for location: '+templateLocation), null);
            }

            self.process(templateContents, cb);
        });
    };

    /**
     * Scans the template for flags.  The callback provides any error and a second
     * parameter that is the populated template with any registered flags replaced.
     *
     * @method process
     * @param {Object} content The raw content to be inspected for flags
     * @param {function} cb Callback function
     */
    TemplateService.prototype.process = function(content, cb) {
        if (!util.isObject(content)) {
            return cb(new Error("TemplateService: A valid content object is required in order for the template engine to process the value. Content="+util.inspect(content)), content);
        }
        else if (!util.isFunction(cb)) {
            throw new Error('cb parameter must be a function');
        }
        
        //iterate parts
        var self  = this;
        var tasks = util.getTasks(content.parts, function(parts, i) {
            return function(callback) {

                //callback with static content
                var part = parts[i];
                if (part.type === TEMPLATE_PIECE_STATIC) {
                    return callback(null, part.val);
                }
                else if (part.type === TEMPLATE_PIECE_FLAG) {

                    self.processFlag(part.val, function(err, subContent) {
                        if (pb.log.isSilly()) {
                            var str = subContent;
                            if (util.isString(str) && str.length > 20) {
                                str = str.substring(0, 17)+'...';
                            }
                            pb.log.silly("TemplateService: Processed flag [%s] Content=[%s]", part.val, str);
                        }
                        callback(err, subContent);
                    });
                }
                else {
                    pb.log.error('An invalid template part type was provided: %s', part.type);
                    callback(new Error('An invalid template part type was provided: '+part.type));
                }
            };
        });
        async.series(tasks, function(err, results) {
            cb(err, util.isArray(results) ? results.join('') : '');
        });
    };

    /**
     * Called when a flag is encountered by the processing engine.  The function is
     * responsible for delegating out the responsibility of the flag to the
     * registered entity.  Some flags are handled by default (although they can
     * always be overriden locally or globally).  The following flags are considered
     * "baked in" and will be handled automatically unless overriden:
     * <ul>
     * <li>^loc_xyz^ - A localization flag.  When provided, the Localization
     * instance will have its "get" function called in an attempt to retrieve the
     * properly translated value for the key (the part betwee "^loc_" and the ending
     * "^").
     * </li>
     * <li>^tmp_somedir=someotherdir=templatefileminusext^ - Specifies a
     * sub-template that should be loaded processed.  The file is expected to have
     * a .html extension.
     * </li>
     * </ul>
     *
     * @method processFlag
     * @param {string} flag The flag to be processed. The value should NOT contain
     * the carrot (^) prefix or postfix.
     * @param {function} cb Callback function
     */
    TemplateService.prototype.processFlag = function(flag, cb) {
        var self = this;

        //check local
        var doFlagProcessing = function(flag, cb) {
            var tmp;
            if ((tmp = self.localCallbacks[flag]) !== undefined) {//local callbacks
                self.handleReplacement(flag, tmp, cb);
                return;
            }
            else if ((tmp = GLOBAL_CALLBACKS[flag]) !== undefined) {//global callbacks
                self.handleReplacement(flag, tmp, cb);
                return;
            }
            else if (flag.indexOf(LOCALIZATION_PREFIX) == 0 && self.localizationService) {//localization
                
                //TODO how do we express params?  Other template vars?
                var key = flag.substring(LOCALIZATION_PREFIX_LEN);
                var opts = {
                    site: self.siteUid,
                    plugin: self.activeTheme,
                    defaultVal: null,
                    params: {/*TODO use the model for this*/}
                };
                var val = self.localizationService.g(key, opts);
                if (!util.isString(val)) {
                    
                    //TODO this is here to be backwards compatible. Remove in 0.6.0
                    val = self.localizationService.get(key);
                }
                return cb(null, val);
            }
            else if (flag.indexOf(TEMPLATE_PREFIX) == 0) {//sub-templates
                self.handleTemplateReplacement(flag, function(err, template) {
                    cb(null, template);
                });
                return;
            }
            else {

                //log result
                if (pb.log.isSilly()) {
                    pb.log.silly("TemplateService: Failed to process flag [%s]", flag);
                }

                //the flag was not registered.  Hand it off to a handler for any 
                //catch-all processing.
                if (util.isFunction(self.unregisteredFlagHandler)) {
                    self.unregisteredFlagHandler(flag, cb);
                }
                else {
                    TemplateService.unregisteredFlagHandler(flag, cb);
                }
            }
        };
        doFlagProcessing(flag, cb);
    };

    /**
     * When a sub-template flag is encountered by the processing engine this
     * function is called to parse the flag and delegate out the loading and
     * processing of the sub-template.
     *
     * @method handleTemplateReplacement
     * @param {string} flag The sub-template flag
     * @param {function} cb Callback function
     */
    TemplateService.prototype.handleTemplateReplacement = function(flag, cb) {
        var pattern      = flag.substring(TEMPLATE_PREFIX_LEN);
        var templatePath = pattern.replace(/=/g, path.sep);

        if (pb.log.isSilly()) {
            pb.log.silly("Template Serice: Loading Sub-Template. FLAG=[%s] Path=[%s]", flag, templatePath);
        }
        this.load(templatePath, function(err, template) {
            cb(err, template);
        });
    };

    /**
     * Called when the processing engine encounters a non-sub-template flag.  The
     * function delegates the content transformation out to either the locally or
     * globally registered function.  In the event that a value was registered and not
     * a function then the value is used as the second parameter in the callback.
     * During template re-assembly the value will be converted to a string.
     *
     * @method handleReplacement
     * @param {string} flag The flag to transform
     * @param {mixed} replacement The value can either be a function to handle the
     * replacement or a value.
     * @param {function} cb Callback function
     */
    TemplateService.prototype.handleReplacement = function(flag, replacement, cb) {
        var self    = this;
        var handler = function(err, content) {

            //check for special condition
            if (content instanceof TemplateValue) {
                content = content.val();
            }
            else if (util.isObject(content) || util.isString(content)){;
                content = HtmlEncoder.htmlEncode(content.toString());
            }

            //prevent infinite loops
            if (!self.reprocess || TemplateService.isFlag(content, flag)) {
                cb(err, content);
            }
            else {
                content = {
                    parts: TemplateService.compile(content)
                };
                self.process(content, cb);
            }
        };

        //do replacement
        if (typeof replacement === 'function') {
            replacement(flag, handler);
        }
        else {
            handler(null, replacement);
        }
    };

    /**
     * Registers a value or function for the specified
     *
     * @method registerLocal
     * @param {string} flag The flag name to map to the value when encountered in a
     * template.
     * @param {mixed} callbackFunctionOrValue The function to execute to perform the
     * transformation or the value to substitute in place of the flag.
     * @return {Boolean} TRUE when registered successfully, FALSE if not
     */
    TemplateService.prototype.registerLocal = function(flag, callbackFunctionOrValue) {
        this.localCallbacks[flag] = callbackFunctionOrValue;
        return true;
    };
    
    /**
     * Registers a model with the template service.  It processes each 
     * key/value pair in the object and creates a dot notated string 
     * registration.  For the object { key: 'value' } with a model name of 
     * "item" would result in 1 local value registration in which the key would 
     * be "item.key".  If no model name existed the registered key would be: 
     * "key". The algorithm fails fast.  On the first bad registeration the 
     * algorithm stops registering keys and returns.  Additionally, if a bad 
     * model object is pass an Error object is thrown.
     * @method registerModel
     * @param {Object} model The model is inspect
     * @param {String} [modelName] The optional name of the model.  The name 
     * will prefix all of the model's keys.
     * @returns {Boolean} TRUE when all keys were successfully registered. 
     * FALSE if a single items fails to register.
     */
    TemplateService.prototype.registerModel = function(model, modelName) {
        if (!util.isObject(model)) {
            throw new Error('The model parameter is required');
        }
        if (!util.isString(modelName)) {
            modelName = '';
        }
        
        //load up the first set of items
        var queue = [];
        util.forEach(model, function(val, key) {
            queue.push({
                key: key,
                prefix: modelName,
                value: val
            });
        });
        
        //create the processing function
        var self = this;
        var register = function(prefix, key, value) {
            
            var flag = (prefix ? prefix + '.' : prefix) + key;
            if (util.isObject(value) && !(value instanceof TemplateValue)) {
                
                var result = true;
                util.forEach(value, function(value, key) {
                    queue.push({
                        key: key,
                        prefix: flag, 
                        value: value
                    });
                });
                return true;
            }
            return self.registerLocal(flag, value);
        };
                           
        //process the queue until it is empty
        var completedResult = true;
        while (queue.length > 0 && completedResult) {
            var item = queue.shift();
            completedResult &= register(item.prefix, item.key, item.value);
        };
        return completedResult;
    };

    /**
     * Retrieves the content template names and locations for the active theme.
     *
     * @method getTemplatesForActiveTheme
     * @param {function} cb A call back that provides two parameters: cb(err, [{templateName: templateLocation])
     */
    TemplateService.prototype.getTemplatesForActiveTheme = function(cb) {
        var self = this;
        this._getActiveTheme(function(err, activeTheme) {

            if(util.isError(err) || activeTheme == null) {
                cb(err, []);
                return;
            }

            //function to retrieve plugin
            var getPlugin = function(uid, callback) {
                if (uid === pb.config.plugins.default) {

                    //load pencilblue plugin
                    var file = pb.PluginService.getDetailsPath(pb.config.plugins.default);
                    pb.PluginService.loadDetailsFile(file, function(err, pb) {
                        if (pb) {
                            pb.dirName = pb.config.plugins.default;
                        }
                        callback(err, pb);
                    });
                }
                else {
                    //load normal plugin
                    self.pluginService.getPlugin(activeTheme, callback);
                }
            };

            //do plugin retrieval
            getPlugin(activeTheme, function(err, plugin) {

                var templates = [];
                if (plugin && plugin.theme && plugin.theme.content_templates) {

                    for (var j = 0; j < plugin.theme.content_templates.length; j++) {

                        var template = plugin.theme.content_templates[j];
                        templates.push(template);
                    }
                }
                cb(err, templates);
            });
        });
    };
    
    /**
     * Creates an instance of Template service based 
     * @method getChildInstance
     * @return {TemplateService}
     */
    TemplateService.prototype.getChildInstance = function() {
        
        var opts = {
            ls: this.localizationService,
            activeTheme: this.activeTheme
        };
        var childTs                     = new TemplateService(opts);
        childTs.theme                   = this.theme;
        childTs.localCallbacks          = util.merge(this.localCallbacks, {});
        childTs.reprocess               = this.reprocess;
        childTs.unregisteredFlagHandler = this.unregisteredFlagHandler;
        return childTs;
    };

    /**
     * Determines if the content provided is equal to the flag
     * @static
     * @method isFlag
     * @param {String} content
     * @param {String} flag
     * @return {String}
     */
    TemplateService.isFlag = function(content, flag) {
        return util.isString(content) && (content.length === 0 || ('^'+flag+'^') === content);
    };

    /**
     * Retrieves the content templates that are available for use to render
     * Articles and pages.
     *
     * @method getAvailableContentTemplates
     * @param site
     * @return {Array} An array of template definitions
     */
    TemplateService.getAvailableContentTemplates = function(site) {
        var templates = pb.PluginService.getActiveContentTemplates(site);
        templates.push(
            {
                theme_uid: pb.config.plugins.default,
                theme_name: 'PencilBlue',
                name: "Default",
                file: "index"
            }
        );
        return templates;
    };

    /**
     * Registers a value or function for the specified
     *
     * @static
     * @method registerGlobal
     * @param {string} flag The flag name to map to the value when encountered in a
     * template.
     * @param {mixed} callbackFunctionOrValue The function to execute to perform the
     * transformation or the value to substitute in place of the flag.
     * @return {Boolean} TRUE when registered successfully, FALSE if not
     */
    TemplateService.registerGlobal = function(key, callbackFunctionOrValue) {
        GLOBAL_CALLBACKS[key] = callbackFunctionOrValue;
        return true;
    };

    /**
     * Retrieves the default path to a template file based on the assumption that
     * the provided path is relative to the pencilblue/plugins/pencilblue/templates/ directory.
     *
     * @static
     * @method getDefaultPath
     * @param {string} templateLocation
     * @return {string} The absolute path
     */
    TemplateService.getDefaultPath = function(templateLocation){
        return path.join(pb.config.docRoot, 'plugins', pb.config.plugins.default, 'templates', templateLocation + '.html');
    };

    /**
     * Retrieves the path to a template file based on the assumption that
     * the provided path is relative to the pencilblue/plugins/[themeName]/templates/ directory.
     *
     * @static
     * @method getCustomPath
     * @param {string} templateLocation
     * @return {string} The absolute path
     */
    TemplateService.getCustomPath = function(themeName, templateLocation){
        return path.join(pb.config.docRoot, 'plugins', themeName, 'templates', templateLocation + '.html');
    };

    /**
     * Compiles the content be eagerly searching for flags/directives.  The static
     * content is also placed into an object.  Whether static or a flag, an object
     * is created and pushed into an array.  Each object has two properties: "type"
     * that describes the type of template part it is (static, flag).  "val" the
     * string value of the part.
     * @static
     * @method compile
     * @param {String} text The template text to compile
     * @param {String} [start='^'] The starting flag marker
     * @param {String} [end='^'] The ending flag marker
     * @return {Array} The array template parts
     */
    TemplateService.compile = function(text, start, end) {
        if (!pb.validation.validateNonEmptyStr(text, true)) {
            pb.log.warn('TemplateService: Cannot parse the content because it is not a valid string: '+text);
            return [];
        }
        if (!pb.validation.validateNonEmptyStr(start, true)) {
            start = '^';
        }
        if (!pb.validation.validateNonEmptyStr(end, true)) {
            end = '^';
        }

        //generates the proper part form
        var genPiece = function(type, val) {
            return {
                type: type,
                val: val
            };
        };

        var i;
        var pipe      = 0;
        var flag      = null;
        var static    = null;
        var flagFound = 0;
        var compiled  = [];
        while ( (i = text.indexOf(start)) >= 0) {

            var start_pos = i + start.length;
            var end_pos   = text.indexOf(end, start_pos);
            if (end_pos >= 0) {

                //determine precursing static content & flag
                flag   = text.substring(start_pos, end_pos);
                static = text.substring(0, start_pos - start.length);

                //add the static content
                if (static) {
                    compiled.push(genPiece(TEMPLATE_PIECE_STATIC, static));
                }

                //add the flag
                if (flag) {
                    compiled.push(genPiece(TEMPLATE_PIECE_FLAG, flag));
                }

                //cut the text down to after the current flag
                text = text.substring(end_pos + end.length);
                if (!text) {
                    break;
                }
            }
            else {
                break;
            }
        }

        //add what's left
        if (text) {
            compiled.push(genPiece(TEMPLATE_PIECE_STATIC, text));
        }
        return compiled;
    };

    /**
     * A value that has special meaning to TemplateService.  It acts as a wrapper
     * for a value to be used in a template along with special processing
     * instructions.
     * @class TemplateValue
     * @constructor
     * @param {String} The raw value to be included in the template processing
     * @param {Boolean} [htmlEncode=true] Indicates if the value should be
     * encoded during serialization.
     */
    function TemplateValue(val, htmlEncode){

        this.raw        = val;
        this.htmlEncode = util.isBoolean(htmlEncode) ? htmlEncode : true;
    };

    /**
     * Encodes the value for an HTML document when a value is provided.
     * @method encode
     * @param {Boolean} [doHtmlEncoding] Sets the property to encode the value to HTML
     * @return {Boolean} The current value of the htmlEncode property
     */
    TemplateValue.prototype.encode = function(doHtmlEncoding) {
        if (doHtmlEncoding == true || doHtmlEncoding == false) {
            this.htmlEncode = doHtmlEncoding;
        }
        return this.htmlEncode;
    };

    /**
     * Specifies that the value should not be encoded for HTML
     * @method skipEncode
     */
    TemplateValue.prototype.skipEncode = function() {
        this.encode(false);
    };

    /**
     * Specifies that the value should be encoded for HTML
     * @method doEncode
     */
    TemplateValue.prototype.doEncode = function() {
        this.encode(true);
    };

    /**
     * Retrieves the processed value represented by this object.
     * @method val
     * @return {String} The processed value
     */
    TemplateValue.prototype.val = function() {
        var val = this.raw;
        if (this.encode()) {
            val = HtmlEncoder.htmlEncode(this.raw);
        }
        return val;
    };

    /**
     * Overrides the toString function in order to properly serialize the value.
     * @method toString
     * @return {String} A string representation of the value that follows the
     * processing instructions.
     */
    TemplateValue.prototype.toString = function() {
        return this.val();
    };
    
    return {
        TemplateService: TemplateService,
        TemplateValue: TemplateValue
    };
};
