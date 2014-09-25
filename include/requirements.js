/**
 * Requirements - Responsible for declaring all of the system types and modules
 * needed to construct the system API object.
 * @copyright PencilBlue, all rights reserved.
 */
//setup global resources & modules
global.url        = require('url');
global.fs         = require('fs');
global.http       = require('http');
global.https      = require('https');
global.path       = require('path');
global.formidable = require('formidable');
global.process    = require('process');
global.minify     = require('minify');
global.winston    = require('winston');
global.async      = require('async');
global.crypto     = require('crypto');
global.util       = require('util');
global.locale     = require('locale');
global.domain     = require('domain');
global.cluster    = require('cluster');

var promise       = require('node-promise');
global.when       = promise.when;
global.Promise    = promise.Promise;
global.Cookies    = require('cookies');

//hack for fs module
fs.exists     = fs.exists     || path.exists;
fs.existsSync = fs.existsSync || path.existsSync;

//define what will become the global entry point into the server api.
global.pb = {};

//load the configuration
pb.config = require('./config');


//configure basic services
//setup utils
pb.utils = require(DOCUMENT_ROOT+'/include/util.js');
global.log =
pb.log     = require(DOCUMENT_ROOT+'/include/utils/logging.js').logger(winston, pb.config);
pb.system  = require(path.join(DOCUMENT_ROOT, 'include/system/system.js'));

//configure cache
pb.CacheFactory = require(DOCUMENT_ROOT+'/include/dao/cache.js');
pb.cache = pb.CacheFactory.getInstance();

//configure the DB manager
pb.DBManager = require(DOCUMENT_ROOT+'/include/dao/db_manager').DBManager;
pb.dbm       = new pb.DBManager();

//setup system class types
pb.DAO = require(DOCUMENT_ROOT+'/include/dao/dao');

//setup validation services
pb.validation = require(DOCUMENT_ROOT+'/include/validation/validation_service.js');

//setup the session handler
pb.SessionHandler = require(DOCUMENT_ROOT+'/include/session/session.js');
pb.session        = new pb.SessionHandler();

//setup object services
pb.SimpleLayeredService         = require(DOCUMENT_ROOT+'/include/service/simple_layered_service.js').SimpleLayeredService;
pb.MemoryEntityService          = require(DOCUMENT_ROOT+'/include/service/memory_entity_service.js').MemoryEntityService;
pb.CacheEntityService           = require(DOCUMENT_ROOT+'/include/service/cache_entity_service.js').CacheEntityService;
pb.DBEntityService              = require(DOCUMENT_ROOT+'/include/service/db_entity_service.js').DBEntityService;
pb.FSEntityService              = require(DOCUMENT_ROOT+'/include/service/fs_entity_service.js').FSEntityService;
pb.JSONFSEntityService          = require(DOCUMENT_ROOT+'/include/service/json_fs_entity_service.js').JSONFSEntityService;
pb.ReadOnlySimpleLayeredService = require(DOCUMENT_ROOT+'/include/service/read_only_simple_layered_service.js').ReadOnlySimpleLayeredService;
pb.TemplateEntityService        = require(DOCUMENT_ROOT+'/include/service/template_entity_service.js').TemplateEntityService;
pb.CustomObjectService          = require(path.join(DOCUMENT_ROOT, 'include/service/entities/custom_object_service.js'));

//setup settings service
pb.SettingServiceFactory = require(DOCUMENT_ROOT+'/include/system/settings.js').SettingServiceFactory;
pb.settings              = pb.SettingServiceFactory.getService(pb.config.settings.use_memory, pb.config.settings.use_cache);

//setup template service
var TemplateModule = require(DOCUMENT_ROOT+'/include/service/entities/template_service.js');
pb.TemplateService = TemplateModule.TemplateService;
pb.TemplateValue   = TemplateModule.TemplateValue;

//setup security
pb.security                       = require(DOCUMENT_ROOT+'/include/access_management.js').SecurityService;
pb.UsernamePasswordAuthentication = require(DOCUMENT_ROOT+'/include/security/authentication/UsernamePasswordAuthentication.js');
pb.FormAuthentication             = require(DOCUMENT_ROOT+'/include/security/authentication/FormAuthentication.js');

//setup user service
pb.UserService = require(DOCUMENT_ROOT+'/include/service/entities/user_service.js').UserService;
pb.users = new pb.UserService();

//setup request handling
pb.BaseController      = require(DOCUMENT_ROOT+'/controllers/base_controller.js').BaseController;
pb.FormController      = require(DOCUMENT_ROOT+'/controllers/form_controller.js').FormController;
pb.DeleteController    = require(DOCUMENT_ROOT+'/controllers/delete_controller.js').DeleteController;
pb.ApiActionController = require(DOCUMENT_ROOT+'/controllers/api/api_action_controller.js').ApiActionController;
pb.RequestHandler      = require(DOCUMENT_ROOT+'/include/http/request_handler.js').RequestHandler;

//setup errors
global.PBError = require(DOCUMENT_ROOT+'/include/error/pb_error.js').PBError;

//setup localization
pb.Localization = require(DOCUMENT_ROOT+'/include/localization.js').Localization;
pb.Localization.init();

//server registration
pb.MongoRegistrationProvider = require(path.join(DOCUMENT_ROOT, '/include/system/registry/mongo_registration_provider.js'));
pb.RedisRegistrationProvider = require(path.join(DOCUMENT_ROOT, '/include/system/registry/redis_registration_provider.js'));
pb.ServerRegistration        = require(DOCUMENT_ROOT+'/include/system/server_registration.js');

//command service
pb.RedisCommandBroker = require(path.join(DOCUMENT_ROOT, '/include/system/command/redis_command_broker.js'));
pb.CommandService     = require(path.join(DOCUMENT_ROOT, '/include/system/command/command_service.js'));

//Jobs
pb.JobRunner             = require(path.join(DOCUMENT_ROOT, '/include/service/jobs/job_runner.js'));
pb.AsyncJobRunner        = require(path.join(DOCUMENT_ROOT, '/include/service/jobs/async_job_runner'));
pb.ClusterJobRunner      = require(path.join(DOCUMENT_ROOT, '/include/service/jobs/cluster_job_runner'));
pb.PluginUninstallJob    = require(path.join(DOCUMENT_ROOT, '/include/service/jobs/plugins/plugin_uninstall_job.js'));
pb.PluginAvailableJob    = require(path.join(DOCUMENT_ROOT, '/include/service/jobs/plugins/plugin_available_job.js'));
pb.PluginDependenciesJob = require(path.join(DOCUMENT_ROOT, '/include/service/jobs/plugins/plugin_dependencies_job.js'));
pb.PluginInitializeJob   = require(path.join(DOCUMENT_ROOT, '/include/service/jobs/plugins/plugin_initialize_job.js'));
pb.PluginInstallJob      = require(path.join(DOCUMENT_ROOT, '/include/service/jobs/plugins/plugin_install_job.js'));

//Email settings and functions
pb.EmailService = require(DOCUMENT_ROOT+'/include/email').EmailService;
pb.email        = new pb.EmailService();

//system requires
pb.DocumentCreator    = require(DOCUMENT_ROOT+'/include/model/create_document.js').DocumentCreator;	// Document creation
pb.content            = require(DOCUMENT_ROOT+'/include/content').ContentService; // Content settings and functions
pb.libraries          = require(DOCUMENT_ROOT+'/include/libraries').LibrariesService; // JS libraries settings and functions
pb.js                 = require(DOCUMENT_ROOT+'/include/client_js').ClientJS;							// Client JS
pb.AdminNavigation    = require(DOCUMENT_ROOT+'/include/admin_navigation').AdminNavigation;			// Admin Navigation
pb.AdminSubnavService = require(DOCUMENT_ROOT+'/include/service/admin/admin_subnav_service.js');
pb.AnalyticsManager   = require(path.join(DOCUMENT_ROOT, '/include/system/analytics_manager.js'));
pb.UrlService         = require(DOCUMENT_ROOT+'/include/service/entities/url_service.js');
pb.CallHomeService    = require(path.join(DOCUMENT_ROOT, '/include/system/call_home_service.js'));
pb.JobService         = require(path.join(DOCUMENT_ROOT, '/include/service/entities/job_service.js'));

//create plugin service
pb.PluginService = require(DOCUMENT_ROOT+'/include/service/entities/plugin_service.js');
pb.plugins       = new pb.PluginService();

//media
pb.FsMediaProvider = require(path.join(DOCUMENT_ROOT, '/include/service/media/fs_media_provider.js'));
pb.MediaService    = require(path.join(DOCUMENT_ROOT, '/include/service/entities/media_service.js'));

//content services
pb.SectionService = require(DOCUMENT_ROOT+'/include/service/entities/section_service.js');
pb.TopMenuService = require(DOCUMENT_ROOT+'/include/theme/top_menu.js');
pb.ArticleService = require(path.join(DOCUMENT_ROOT, '/include/service/entities/article_service.js'));

//Export system object
module.exports = pb;
