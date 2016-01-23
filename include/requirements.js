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
var path = require('path');

/**
 * Requirements - Responsible for declaring all of the system types and modules
 * needed to construct the system API object.
 * @class PB
 * @param {Object} config
 * @return {Object} The pb namespace
 */
module.exports = function PB(config) {

    //define what will become the global entry point into the server api.
    var pb = {};

    //make the configuration available
    pb.config = config;

    //setup utils
    pb.util    = require(path.join(config.docRoot, '/include/util.js'));
    Object.defineProperty(pb, 'utils', {
        get: function() {
            pb.log.warn('PencilBlue: pb.utils is deprecated.  Use pb.util instead');
            return pb.util;
        }
    });

    //initialize logging
    pb.log    = require(path.join(config.docRoot, '/include/utils/logging.js'))(config);

    //setup the System instance
    pb.System = require(path.join(config.docRoot, 'include/system/system.js'));
    pb.system = new pb.System(pb);

    //configure cache
    var CacheModule = require(path.join(config.docRoot, '/include/dao/cache.js'));
    pb.CacheFactory = CacheModule(pb).CacheFactory;
    pb.cache        = pb.CacheFactory.getInstance();

    //configure the DB manager
    pb.DBManager = require(config.docRoot+'/include/dao/db_manager')(pb);
    pb.dbm       = new pb.DBManager();

    //setup system class types
    pb.DAO = require(config.docRoot+'/include/dao/dao')(pb);

    //setup validation services
    var ValidationModule = require(path.join(config.docRoot, '/include/validation/validation_service.js'));
    pb.ValidationService = ValidationModule(pb);
    pb.validation        = pb.ValidationService;

    //lock services
    pb.locks = {
        providers: {
            CacheLockProvider: require(path.join(config.docRoot, '/include/service/locks/providers/cache_lock_provider.js'))(pb),
            DbLockProvider: require(path.join(config.docRoot, '/include/service/locks/providers/db_lock_provider.js'))(pb)
        }
    };
    pb.LockService = require(path.join(config.docRoot, '/include/service/locks/lock_service.js'))(pb);

    //setup the session handler
    var SessionModule = require(path.join(config.docRoot, '/include/session/session.js'));
    pb.SessionHandler = SessionModule(pb);
    pb.session        = new pb.SessionHandler(pb.SessionHandler.getSessionStoreInstance());

    pb.BaseObjectService = require(path.join(config.docRoot, '/include/service/base_object_service.js'))(pb);

    //setup site service
    pb.SiteService = require(path.join(config.docRoot, '/include/service/entities/site_service.js'))(pb);
    pb.SiteQueryService = require(path.join(config.docRoot, '/include/service/entities/site_query_service.js'))(pb);


  //setup object services
    pb.SimpleLayeredService         = require(path.join(config.docRoot, '/include/service/simple_layered_service.js'))(pb);
    pb.MemoryEntityService          = require(path.join(config.docRoot, '/include/service/memory_entity_service.js'))(pb);
    pb.CacheEntityService           = require(path.join(config.docRoot, '/include/service/cache_entity_service.js'))(pb);
    pb.DBEntityService              = require(path.join(config.docRoot, '/include/service/db_entity_service.js'))(pb);
    pb.FSEntityService              = require(path.join(config.docRoot, '/include/service/fs_entity_service.js'))(pb);
    pb.JSONFSEntityService          = require(path.join(config.docRoot, '/include/service/json_fs_entity_service.js'))(pb);
    pb.ReadOnlySimpleLayeredService = require(path.join(config.docRoot, '/include/service/read_only_simple_layered_service.js'))(pb);
    pb.TemplateEntityService        = require(path.join(config.docRoot, '/include/service/template_entity_service.js'))(pb);
    pb.CustomObjectService          = require(path.join(config.docRoot, 'include/service/entities/custom_object_service.js'))(pb);

    //setup template service
    var TemplateModule = require(config.docRoot+'/include/service/entities/template_service.js')(pb);
    pb.TemplateService = TemplateModule.TemplateService;
    pb.TemplateValue   = TemplateModule.TemplateValue;

    //setup security
    pb.SecurityService                = require(path.join(config.docRoot, '/include/access_management.js'))(pb);
    pb.security                       = pb.SecurityService;
    var Authentication                = require(path.join(config.docRoot, '/include/security/authentication'))(pb);
    pb.UsernamePasswordAuthentication = Authentication.UsernamePasswordAuthentication;
    pb.FormAuthentication             = Authentication.FormAuthentication;
    pb.TokenAuthentication            = Authentication.TokenAuthentication;

    //setup user service
    pb.UserService       = require(path.join(config.docRoot, '/include/service/entities/user_service.js'))(pb);
    Object.defineProperty(pb, 'users', {
        get: function() {
            pb.log.warn('PencilBlue: pb.users is deprecated.  Use new pb.UserService(context) instead');
            return new pb.UserService();
        }
    });

    //setup request handling
    var BodyParsers        = require(path.join(config.docRoot, 'include/http/parsers'))(pb);
    pb.BaseBodyParser      = BodyParsers.BaseBodyParser;
    pb.JsonBodyParser      = BodyParsers.JsonBodyParser;
    pb.FormBodyParser      = BodyParsers.FormBodyParser;
    pb.BaseController      = require(path.join(config.docRoot, '/controllers/base_controller.js'))(pb);
    pb.BaseApiController   = require(path.join(config.docRoot, '/controllers/api/base_api_controller.js'))(pb);
    pb.BaseAdminController = require(path.join(config.docRoot, '/controllers/admin/base_admin_controller.js'))(pb);
    pb.ViewController      = require(path.join(config.docRoot, '/controllers/view_controller.js'))(pb);
    pb.FormController      = require(path.join(config.docRoot, '/controllers/form_controller.js'))(pb);
    pb.DeleteController    = require(path.join(config.docRoot, '/controllers/delete_controller.js'))(pb);
    pb.ApiActionController = require(path.join(config.docRoot, '/controllers/api/api_action_controller.js'))(pb);
    pb.ErrorViewController = require(path.join(config.docRoot, '/controllers/error_controller.js'))(pb);
    pb.RequestHandler      = require(path.join(config.docRoot, '/include/http/request_handler.js'))(pb);
    pb.HttpStatus          = require('http-status-codes');

    //setup errors
    pb.PBError    = require(path.join(config.docRoot, '/include/error/pb_error.js'))(pb);
    pb.ErrorsOverTime = require(path.join(config.docRoot, '/include/error/errors_over_time.js'))(pb);
    pb.ErrorFormatters = require(path.join(config.docRoot, '/include/error/formatters/error_formatters.js'))(pb);

    //setup localization
    pb.Localization = require(path.join(config.docRoot, '/include/localization.js'))(pb);

    //server registration
    pb.MongoRegistrationProvider = require(path.join(config.docRoot, '/include/system/registry/mongo_registration_provider.js'))(pb);
    pb.RedisRegistrationProvider = require(path.join(config.docRoot, '/include/system/registry/redis_registration_provider.js'))(pb);
    pb.ServerRegistration        = require(path.join(config.docRoot, '/include/system/server_registration.js'))(pb);

    //command service
    pb.RedisCommandBroker = require(path.join(config.docRoot, '/include/system/command/redis_command_broker.js'))(pb);
    pb.MongoCommandBroker = require(path.join(config.docRoot, '/include/system/command/mongo_command_broker.js'))(pb);
    pb.CommandService     = require(path.join(config.docRoot, '/include/system/command/command_service.js'))(pb);

    //setup settings service
    pb.SettingServiceFactory = require(path.join(config.docRoot, '/include/system/settings.js'))(pb);
    pb.settings              = pb.SettingServiceFactory.getService(pb.config.settings.use_memory, pb.config.settings.use_cache);

    //Jobs
    pb.JobRunner             = require(path.join(config.docRoot, '/include/service/jobs/job_runner.js'))(pb);
    pb.AsyncJobRunner        = require(path.join(config.docRoot, '/include/service/jobs/async_job_runner'))(pb);
    pb.ClusterJobRunner      = require(path.join(config.docRoot, '/include/service/jobs/cluster_job_runner'))(pb);
    pb.PluginJobRunner       = require(path.join(config.docRoot, '/include/service/jobs/plugins/plugin_job_runner.js'))(pb);
    pb.PluginUninstallJob    = require(path.join(config.docRoot, '/include/service/jobs/plugins/plugin_uninstall_job.js'))(pb);
    pb.PluginAvailableJob    = require(path.join(config.docRoot, '/include/service/jobs/plugins/plugin_available_job.js'))(pb);
    pb.PluginDependenciesJob = require(path.join(config.docRoot, '/include/service/jobs/plugins/plugin_dependencies_job.js'))(pb);
    pb.PluginInitializeJob   = require(path.join(config.docRoot, '/include/service/jobs/plugins/plugin_initialize_job.js'))(pb);
    pb.PluginInstallJob      = require(path.join(config.docRoot, '/include/service/jobs/plugins/plugin_install_job.js'))(pb);
    pb.SiteJobRunner         = require(path.join(config.docRoot, '/include/service/jobs/sites/site_job_runner.js'))(pb);
    pb.SiteActivateJob       = require(path.join(config.docRoot, '/include/service/jobs/sites/site_activate_job.js'))(pb);
    pb.SiteDeactivateJob     = require(path.join(config.docRoot, '/include/service/jobs/sites/site_deactivate_job.js'))(pb);
    pb.SiteCreateEditJob     = require(path.join(config.docRoot, '/include/service/jobs/sites/site_create_edit_job.js'))(pb);

    //Email settings and functions
    pb.EmailService = require(path.join(config.docRoot, '/include/email'))(pb);

    //system requires
    pb.DocumentCreator = require(config.docRoot+'/include/model/create_document.js')(pb);	// Document creation
    pb.ContentService  = require(path.join(config.docRoot, '/include/content'))(pb); // Content settings and functions
    Object.defineProperty(pb, 'content', {
        get: function() {
            pb.log.warn('PencilBlue: pb.content is deprecated.  Use pb.ContentService instead');
            return new pb.ContentService();
        }
    });
    pb.LibrariesService = require(path.join(config.docRoot, '/include/libraries.js'))(pb); // JS libraries settings and functions
    Object.defineProperty(pb, 'libraries', {
        get: function() {
            pb.log.warn('PencilBlue: pb.libraries is deprecated.  Use pb.LibrariesService instead');
            return new pb.ContentService();
        }
    });
    pb.ClientJs = require(config.docRoot+'/include/client_js')(pb); // Client JS
    Object.defineProperty(pb, 'js', {
        get: function() {
            pb.log.warn('PencilBlue: pb.js is deprecated.  Use pb.ClientJs instead');
            return pb.ClientJS;
        }
    });
    pb.AdminNavigation    = require(path.join(config.docRoot, '/include/admin_navigation'))(pb);			// Admin Navigation
    pb.AdminSubnavService = require(path.join(config.docRoot, '/include/service/admin/admin_subnav_service.js'))(pb);
    pb.AnalyticsManager   = require(path.join(config.docRoot, '/include/system/analytics_manager.js'))(pb);
    pb.UrlService         = require(path.join(config.docRoot, '/include/service/entities/url_service.js'))(pb);
    pb.CallHomeService    = require(path.join(config.docRoot, '/include/system/call_home_service.js'))(pb);
    pb.JobService         = require(path.join(config.docRoot, '/include/service/entities/job_service.js'))(pb);
    pb.TokenService       = require(path.join(config.docRoot, '/include/service/entities/token_service.js'))(pb);

    //create plugin service
    pb.PluginService = require(path.join(config.docRoot, '/include/service/entities/plugin_service.js'))(pb);
    Object.defineProperty(pb, 'plugins', {
        get: function() {
            pb.log.warn('PencilBlue: pb.plugins is deprecated.  Use new pb.PluginService instead');
            return new pb.PluginService();
        }
    });

    //create plugin setting service
    pb.PluginSettingService = require(path.join(config.docRoot, '/include/service/entities/plugin_setting_service.js'))(pb);
    pb.PluginRepository = require(path.join(config.docRoot, '/include/repository/plugin_repository.js'))(pb);

    //media renderers
    pb.media = {
        renderers: {
            BaseMediaRenderer: require(path.join(config.docRoot, '/include/service/media/renderers/base_media_renderer.js'))(pb),
        },

        providers: {
            FsMediaProvider: require(path.join(config.docRoot, '/include/service/media/fs_media_provider.js'))(pb),
            MongoMediaProvider: require(path.join(config.docRoot, '/include/service/media/mongo_media_provider.js'))(pb)
        }
    };
    pb.media.renderers.ImageMediaRenderer = require(path.join(config.docRoot, '/include/service/media/renderers/image_media_renderer.js'))(pb),
    pb.media.renderers.VideoMediaRenderer = require(path.join(config.docRoot, '/include/service/media/renderers/video_media_renderer.js'))(pb),
    pb.media.renderers.YouTubeMediaRenderer = require(path.join(config.docRoot, '/include/service/media/renderers/youtube_media_renderer.js'))(pb),
    pb.media.renderers.DailyMotionMediaRenderer = require(path.join(config.docRoot, '/include/service/media/renderers/daily_motion_media_renderer.js'))(pb),
    pb.media.renderers.VimeoMediaRenderer = require(path.join(config.docRoot, '/include/service/media/renderers/vimeo_media_renderer.js'))(pb),
    pb.media.renderers.VineMediaRenderer = require(path.join(config.docRoot, '/include/service/media/renderers/vine_media_renderer.js'))(pb),
    pb.media.renderers.InstagramMediaRenderer = require(path.join(config.docRoot, '/include/service/media/renderers/instagram_media_renderer.js'))(pb),
    pb.media.renderers.SlideShareMediaRenderer = require(path.join(config.docRoot, '/include/service/media/renderers/slideshare_media_renderer.js'))(pb),
    pb.media.renderers.TrinketMediaRenderer = require(path.join(config.docRoot, '/include/service/media/renderers/trinket_media_renderer.js'))(pb),
    pb.media.renderers.StorifyMediaRenderer = require(path.join(config.docRoot, '/include/service/media/renderers/storify_media_renderer.js'))(pb),
    pb.media.renderers.KickStarterMediaRenderer = require(path.join(config.docRoot, '/include/service/media/renderers/kickstarter_media_renderer.js'))(pb);
    pb.media.renderers.PdfMediaRenderer = require(path.join(config.docRoot, '/include/service/media/renderers/pdf_media_renderer.js'))(pb);

    //providers and service
    pb.MediaService = require(path.join(config.docRoot, '/include/service/entities/media_service.js'))(pb);

    //content services
    pb.SectionService = require(config.docRoot+'/include/service/entities/section_service.js')(pb);
    pb.TopMenuService = require(config.docRoot+'/include/theme/top_menu.js')(pb);

    //object services
    pb.TopicService         = require(path.join(config.docRoot, '/include/service/entities/topic_service.js'))(pb);
    pb.ContentObjectService = require(path.join(config.docRoot, '/include/service/entities/content/content_object_service.js'))(pb);
    pb.ArticleServiceV2     = require(path.join(config.docRoot, '/include/service/entities/content/article_service_v2.js'))(pb);
    pb.ArticleRenderer      = require(path.join(config.docRoot, '/include/service/entities/content/article_renderer.js'))(pb);
    pb.PageRenderer         = require(path.join(config.docRoot, '/include/service/entities/content/page_renderer.js'))(pb);
    pb.PageService          = require(path.join(config.docRoot, '/include/service/entities/content/page_service.js'))(pb);
    pb.ContentViewLoader    = require(path.join(config.docRoot, '/include/service/entities/content/content_view_loader.js'))(pb);

    pb.SiteMapService = require(path.join(config.docRoot, '/include/service/entities/site_map_service.js'))(pb);

    var ArticleServiceModule = require(path.join(config.docRoot, '/include/service/entities/article_service.js'))(pb);
    pb.ArticleService        = ArticleServiceModule.ArticleService;
    pb.MediaLoader           = ArticleServiceModule.MediaLoader;
    pb.CommentService        = require(config.docRoot+'/include/theme/comments.js')(pb);

    return pb;
};
