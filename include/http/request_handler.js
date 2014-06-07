/**
 * req Handler - Responsible for processing a single req by delegating it to the correct controllers
 */
function RequestHandler(server, req, resp){
	this.startTime = (new Date()).getTime();
	this.server    = server;
	this.req       = req;
	this.resp      = resp;
	this.url       = url.parse(req.url, true);
}

RequestHandler.DEFAULT_THEME = 'pencilblue';

RequestHandler.storage = [];
RequestHandler.index   = {};

RequestHandler.CORE_ROUTES = [
	{
		method: 'get',
		path: "/public/:plugin/*",
		access_level: 0,
		auth_required: false,
		setup_required: false,
		controller: path.join(DOCUMENT_ROOT, 'controllers', 'public.js'),
		content_type: 'text/html'
	},
    {
    	method: 'get',
    	path: "/setup",
    	access_level: 0,
    	auth_required: false,
    	setup_required: false,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'setup.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'post',
    	path: "/actions/setup",
    	access_level: 0,
    	auth_required: false,
    	setup_required: false,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'setup.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/admin/login",
    	access_level: 0,
    	auth_required: false,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'login.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'post',
    	path: "/actions/login",
    	access_level: 0,
    	auth_required: false,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'login.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'post',
    	path: "/actions/forgot_password",
    	access_level: 0,
    	auth_required: false,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'forgot_password.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/admin",
    	access_level: ACCESS_WRITER,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'index.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'post',
    	path: "/actions/logout",
    	access_level: 0,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'logout.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/",
    	access_level: 0,
    	auth_required: false,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'index.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/admin/content/sections",
    	access_level: ACCESS_EDITOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'content', 'sections.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/admin/content/sections/section_map",
    	access_level: ACCESS_EDITOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'content', 'sections', 'section_map.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/admin/content/sections/new_section",
    	access_level: ACCESS_EDITOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'content', 'sections', 'new_section.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'post',
    	path: "/actions/admin/content/sections/new_section",
    	access_level: ACCESS_EDITOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'admin', 'content', 'sections', 'new_section.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'post',
    	path: "/actions/admin/content/sections/section_map",
    	access_level: ACCESS_EDITOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'admin', 'content', 'sections', 'section_map.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/admin/content/sections/edit_section/:id",
    	access_level: ACCESS_EDITOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'content', 'sections', 'edit_section.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/actions/admin/content/sections/delete_section/:id",
    	access_level: ACCESS_EDITOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'admin', 'content', 'sections', 'delete_section.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'post',
    	path: "/actions/admin/content/sections/edit_section/:id",
    	access_level: ACCESS_EDITOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'admin', 'content', 'sections', 'edit_section.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/admin/content/topics/manage_topics",
    	access_level: ACCESS_EDITOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'content', 'topics', 'manage_topics.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'post',
    	path: "/actions/admin/content/topics/delete_topic/:id",
    	access_level: ACCESS_EDITOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'admin', 'content', 'topics', 'delete_topic.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/admin/site_settings/configuration",
    	access_level: ACCESS_ADMINISTRATOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'site_settings', 'configuration.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/admin/site_settings/content",
    	access_level: ACCESS_ADMINISTRATOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'site_settings', 'content.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'post',
    	path: "/actions/admin/site_settings/content",
    	access_level: ACCESS_ADMINISTRATOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'admin', 'site_settings', 'content.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/admin/site_settings/email",
    	access_level: ACCESS_ADMINISTRATOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'site_settings', 'email.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'post',
    	path: "/actions/admin/site_settings/email",
    	access_level: ACCESS_ADMINISTRATOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'admin', 'site_settings', 'email.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/admin/content/topics/new_topic",
    	access_level: ACCESS_EDITOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'content', 'topics', 'new_topic.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'post',
    	path: "/actions/admin/content/topics/new_topic",
    	access_level: ACCESS_EDITOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'admin', 'content', 'topics', 'new_topic.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/admin/content/topics/import_topics",
    	access_level: ACCESS_EDITOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'content', 'topics', 'import_topics.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'post',
    	path: "/actions/admin/content/topics/import_topics",
    	access_level: ACCESS_EDITOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'admin', 'content', 'topics', 'import_topics.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/admin/content/topics/",
    	access_level: ACCESS_EDITOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'content', 'topics.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/admin/content/pages/new_page",
    	access_level: ACCESS_EDITOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'content', 'pages', 'new_page.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'post',
    	path: "/actions/admin/content/pages/new_page",
    	access_level: ACCESS_EDITOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'admin', 'content', 'pages', 'new_page.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/admin/content/pages/manage_pages",
    	access_level: ACCESS_EDITOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'content', 'pages', 'manage_pages.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/admin/content/pages/edit_page/:id",
    	access_level: ACCESS_EDITOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'content', 'pages', 'edit_page.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'post',
    	path: "/actions/admin/content/pages/edit_page/:id",
    	access_level: ACCESS_EDITOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'admin', 'content', 'pages', 'edit_page.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'post',
    	path: "/api/admin/content/pages/save_draft/:id",
    	access_level: ACCESS_WRITER,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'api', 'admin', 'content', 'pages', 'save_draft.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'post',
    	path: "/actions/admin/content/pages/new_page",
    	access_level: ACCESS_EDITOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'admin', 'content', 'pages', 'new_page.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'post',
    	path: "/actions/admin/content/pages/delete_page/:id",
    	access_level: ACCESS_EDITOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'admin', 'content', 'pages', 'delete_page.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/admin/content/media",
    	access_level: ACCESS_WRITER,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'content', 'media.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/admin/content/media/manage_media",
    	access_level: ACCESS_WRITER,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'content', 'media', 'manage_media.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/admin/content/media/add_media",
    	access_level: ACCESS_WRITER,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'content', 'media', 'add_media.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'post',
    	path: "/actions/admin/content/media/add_media",
    	access_level: ACCESS_WRITER,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'admin', 'content', 'media', 'add_media.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/admin/content/media/edit_media/:id",
    	access_level: ACCESS_WRITER,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'content', 'media', 'edit_media.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'post',
    	path: "/actions/admin/content/media/edit_media/:id",
    	access_level: ACCESS_WRITER,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'admin', 'content', 'media', 'edit_media.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'post',
    	path: "/actions/admin/content/media/delete_media/:id",
    	access_level: ACCESS_WRITER,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'admin', 'content', 'media', 'delete_media.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'post',
    	path: "/actions/admin/content/media/inline_add_media",
    	access_level: ACCESS_WRITER,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'admin', 'content', 'media', 'inline_add_media.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'post',
    	path: "/actions/admin/content/media/upload_media",
    	access_level: ACCESS_WRITER,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'admin', 'content', 'media', 'upload_media.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/admin/content/articles",
    	access_level: ACCESS_WRITER,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'content', 'articles.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/admin/content/articles/manage_articles",
    	access_level: ACCESS_WRITER,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'content', 'articles', 'manage_articles.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/admin/content/articles/new_article",
    	access_level: ACCESS_WRITER,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'content', 'articles', 'new_article.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'post',
    	path: "/actions/admin/content/articles/delete_article/:id",
    	access_level: ACCESS_EDITOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'admin', 'content', 'articles', 'delete_article.js'),
    },
    {
    	method: 'get',
    	path: "/api/custom_objects/get_object_type_name_available",
    	access_level: ACCESS_EDITOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'api', 'custom_objects', 'get_object_type_name_available.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/admin/content/articles/edit_article/:id",
    	access_level: ACCESS_WRITER,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'content', 'articles', 'edit_article.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'post',
    	path: "/actions/admin/content/articles/edit_article/:id",
    	access_level: ACCESS_WRITER,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'admin', 'content', 'articles', 'edit_article.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'post',
    	path: "/api/admin/content/articles/save_draft/:id",
    	access_level: ACCESS_WRITER,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'api', 'admin', 'content', 'articles', 'save_draft.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/preview/:type/:id",
    	access_level: ACCESS_WRITER,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'preview.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'post',
    	path: "/actions/admin/content/articles/new_article",
    	access_level: ACCESS_WRITER,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'admin', 'content', 'articles', 'new_article.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'post',
    	path: "/actions/user/manage_account/change_password",
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'user', 'manage_account', 'change_password.js'),
    },
    {
    	method: 'get',
    	path: "/admin/content/custom_objects",
    	auth_required: true,
    	access_level: ACCESS_EDITOR,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'content', 'custom_objects.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/admin/content/custom_objects/manage_object_types",
    	access_level: ACCESS_EDITOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'content', 'custom_objects', 'manage_object_types.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/admin/content/custom_objects/new_object_type",
    	access_level: ACCESS_EDITOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'content', 'custom_objects', 'new_object_type.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'post',
    	path: "/actions/user/manage_account/profile",
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'user', 'manage_account', 'profile.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'post',
    	path: "/actions/user/resend_verification",
    	auth_required: false,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'user', 'resend_verification.js'),
    },
    {
    	path: "/actions/admin/content/custom_objects/new_object_type",
    	access_level: ACCESS_EDITOR,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'admin', 'content', 'custom_objects', 'new_object_type.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/admin/content/custom_objects/edit_object_type/:name",
    	access_level: ACCESS_EDITOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'content', 'custom_objects', 'edit_object_type.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'post',
    	path: "/actions/user/sign_up",
    	auth_required: false,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'user', 'sign_up.js'),
    },
    {
    	path: "/actions/admin/content/custom_objects/edit_object_type/:id",
    	access_level: ACCESS_EDITOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'admin', 'content', 'custom_objects', 'edit_object_type.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/actions/user/verify_email",
    	auth_required: false,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'user', 'verify_email.js'),
    },
    {
    	path: "/actions/admin/content/custom_objects/delete_object_type/:id",
    	access_level: ACCESS_EDITOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'admin', 'content', 'custom_objects', 'delete_object_type.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/admin/users",
    	auth_required: true,
    	access_level: ACCESS_ADMINISTRATOR,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'users.js'),
    },
    {
    	method: 'get',
    	path: "/admin/site_settings",
    	auth_required: true,
    	access_level: ACCESS_ADMINISTRATOR,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'site_settings.js'),
    },
    {
    	method: 'get',
    	path: "/admin/users/new_user",
    	auth_required: true,
    	access_level: ACCESS_EDITOR,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'users', 'new_user.js'),
    },
    {
    	method: 'get',
    	path: "/admin/users/manage_users",
    	auth_required: true,
    	access_level: ACCESS_EDITOR,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'users', 'manage_users.js'),
    },
    {
    	method: 'get',
    	path: "/admin/users/edit_user/:id",
    	auth_required: true,
    	access_level: ACCESS_EDITOR,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'users', 'edit_user.js'),
    },
    {
    	method: 'post',
    	path: "/actions/admin/users/edit_user/:id",
    	auth_required: true,
    	access_level: ACCESS_EDITOR,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'admin', 'users', 'edit_user.js'),
    },
    {
    	method: 'get',
    	path: "/admin/users/change_password/:id",
    	auth_required: true,
    	access_level: ACCESS_EDITOR,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'users', 'change_password.js'),
    },
    {
    	method: 'post',
    	path: "/actions/admin/users/change_password/:id",
    	auth_required: true,
    	access_level: ACCESS_EDITOR,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'admin', 'users', 'change_password.js'),
    },
    {
    	method: 'get',
    	path: "/actions/admin/users/send_password_reset/:id",
    	auth_required: true,
    	access_level: ACCESS_MANAGING_EDITOR,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'admin', 'users', 'send_password_reset.js'),
    },
    {
    	method: 'post',
    	path: "/actions/admin/users/new_user",
    	auth_required: true,
    	access_level: ACCESS_EDITOR,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'admin', 'users', 'new_user.js'),
    },
    {
    	method: 'get',
    	path: "/sitemap",
    	auth_required: false,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'sitemap.js'),
    	content_type: 'application/xml'
    },
    {
    	method: 'get',
    	path: "/user/sign_up",
    	auth_required: false,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'user', 'sign_up.js'),
    },
    {
    	path: "/admin/content/custom_objects/manage_objects/:name",
    	access_level: ACCESS_EDITOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'content', 'custom_objects', 'manage_objects.js'),
    	content_type: 'text/html'
    },
    {
    	path: "/admin/content/custom_objects/sort_objects/:name",
    	access_level: ACCESS_EDITOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'content', 'custom_objects', 'sort_objects.js'),
    	content_type: 'text/html'
    },
    {
        method: 'post',
    	path: "/actions/admin/content/custom_objects/sort_objects/:type_id",
    	access_level: ACCESS_EDITOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'admin', 'content', 'custom_objects', 'sort_objects.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/admin/content/custom_objects/new_object/:type",
    	access_level: ACCESS_EDITOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'content', 'custom_objects', 'new_object.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'post',
    	path: "/actions/admin/content/custom_objects/new_object/:type_id",
    	access_level: ACCESS_EDITOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'admin', 'content', 'custom_objects', 'new_object.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/admin/content/custom_objects/edit_object/:id",
    	access_level: ACCESS_EDITOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'content', 'custom_objects', 'edit_object.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'post',
    	path: "/actions/admin/content/custom_objects/edit_object/:id",
    	access_level: ACCESS_EDITOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'admin', 'content', 'custom_objects', 'edit_object.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/api/user/get_username_available",
    	auth_required: false,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'api', 'user', 'get_username_available.js'),
    	content_type: 'application/json'
    },
    {
    	method: 'get',
    	path: "/user/login",
    	auth_required: false,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'user', 'login.js'),
    },
    {
    	path: "/actions/admin/content/custom_objects/delete_object",
    	access_level: ACCESS_EDITOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'admin', 'content', 'custom_objects', 'delete_object.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/feed",
    	auth_required: false,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'feed.js'),
    	content_type: 'application/rss+xml'
    },
    {
    	method: 'get',
    	path: "/section/:customUrl",
    	auth_required: false,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'section.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/article/:customUrl",
    	auth_required: false,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'article.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/page/:customUrl",
    	auth_required: false,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'page.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'post',
    	path: "/api/comments/new_comment",
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'api', 'comments', 'new_comment.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/user/change_password",
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'user', 'change_password.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/user/manage_account",
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'user', 'manage_account.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/user/resend_verification",
    	auth_required: false,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'user', 'resend_verification.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/user/verification_sent",
    	auth_required: false,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'user', 'verification_sent.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/admin/plugins",
    	auth_required: true,
    	access_level: ACCESS_ADMINISTRATOR,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'plugins', 'index.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'post',
    	path: "/api/plugins/:action/:id",
    	auth_required: true,
    	access_level: ACCESS_ADMINISTRATOR,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'api', 'plugins', 'plugin_api.js'),
    	content_type: 'application/json'
    },
    {
    	method: 'get',
    	path: "/admin/users/permissions",
    	auth_required: true,
    	access_level: ACCESS_ADMINISTRATOR,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'users', 'permissions.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/admin/plugins/view/:id",
    	auth_required: true,
    	access_level: ACCESS_ADMINISTRATOR,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'plugins', 'details.js'),
    	content_type: 'text/html'
    },
    {
    	path: "/admin/plugins/settings/:id",
    	auth_required: true,
    	access_level: ACCESS_ADMINISTRATOR,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'plugins', 'settings.js'),
    	content_type: 'text/html'
    },
    {
    	path: "/admin/themes/settings/:id",
    	auth_required: true,
    	access_level: ACCESS_ADMINISTRATOR,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'themes', 'settings.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/admin/themes",
    	auth_required: true,
    	access_level: ACCESS_ADMINISTRATOR,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'themes', 'index.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'post',
    	path: "/actions/admin/themes",
    	auth_required: true,
    	access_level: ACCESS_ADMINISTRATOR,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'admin', 'themes', 'index.js'),
    },
    {
    	path: "/api/content/get_articles",
    	auth_required: false,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'api', 'content', 'get_articles.js'),
    	content_type: 'application/json'
    },
    {
        path: "/api/content/get_media_embed",
        auth_required: false,
        controller: path.join(DOCUMENT_ROOT, 'controllers', 'api', 'content', 'get_media_embed.js'),
        content_type: 'application/json'
    },
    {
    	method: 'get',
        path: "/api/url/:action",
        auth_required: true,
        access_level: ACCESS_WRITER,
        controller: path.join(DOCUMENT_ROOT, 'controllers', 'api', 'admin', 'url_api.js'),
        content_type: 'application/json'
    },
    {
    	method: 'get',
        path: "/api/content/search",
        auth_required: true,
        access_level: ACCESS_WRITER,
        controller: path.join(DOCUMENT_ROOT, 'controllers', 'api', 'content', 'search.js'),
        content_type: 'application/json'
    },
    {
        method: 'get',
        path: "/admin/content/comments/manage_comments",
        auth_required: true,
        access_level: ACCESS_EDITOR,
        controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'content', 'comments', 'manage_comments.js'),
        content_type: 'text/html'
    },
    {
        method: 'get',
        path: "/actions/admin/content/comments/delete_comment/:id",
        access_level: ACCESS_EDITOR,
        auth_required: true,
        controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'admin', 'content', 'comments', 'delete_comment.js'),
        content_type: 'text/html'
    },
];

RequestHandler.init = function(){

	//iterate core routes adding them
	pb.log.debug('RequestHandler: Registering System Routes');
	for (var i = 0; i < RequestHandler.CORE_ROUTES.length; i++) {
		var descriptor = RequestHandler.CORE_ROUTES[i];

		//register the route
		RequestHandler.registerRoute(descriptor, RequestHandler.DEFAULT_THEME);
	}
};

RequestHandler.generateRedirect = function (location) {
	return {
		redirect: location
	};
};

RequestHandler.isValidRoute = function(descriptor) {
	return fs.existsSync(descriptor.controller) &&
		   typeof descriptor.path != 'undefined';
};

RequestHandler.unregisterThemeRoutes = function(theme) {

	var routesRemoved = 0;
	for (var i = 0; i < RequestHandler.storage.length; i++) {
		var path   = RequestHandler.storage[i].path;
		var result = RequestHandler.unregisterRoute(path, theme);
		if (result) {
			routesRemoved++;
		}
	}
	return routesRemoved;
};

RequestHandler.unregisterRoute = function(path, theme) {

	//get the pattern to check for
	var pattern    = null;
	var patternObj = RequestHandler.getRoutePattern(path);
	if (patternObj) {
		pattern = patternObj.pattern;
	}
	else {//invalid path provided
		return false;
	}

	//check if that pattern is registered for any theme
	if (RequestHandler.index[pattern] === undefined) {
		return false;
	}

	//check for theme
	var descriptor = RequestHandler.storage[RequestHandler.index[pattern]];
	if (!descriptor.themes[theme]) {
		return false;
	}

	//remove from service
	delete descriptor.themes[theme];
	return true;
};

RequestHandler.registerRoute = function(descriptor, theme){
	//validate route
	if (!RequestHandler.isValidRoute(descriptor)) {
		pb.log.error("Route Validation Failed for: "+JSON.stringify(descriptor));
		return false;
	}

	//standardize http method (if exists) to upper case
	if (descriptor.method !== undefined) {
		descriptor.method = descriptor.method.toUpperCase();
	}

	//get pattern and path variables
	var patternObj = RequestHandler.getRoutePattern(descriptor.path);
	var pathVars   = patternObj.pathVars;
	var pattern    = patternObj.pattern;

	//insert it
	var routeDescriptor = null;
	if (RequestHandler.index[pattern] !== undefined) {

		//exists so find it
		for (var i = 0; i < RequestHandler.storage.length; i++) {
			var route = RequestHandler.storage[i];
			if (route.pattern == pattern) {
				routeDescriptor = route;
				break;
			}
		}
	}
	else{//does not exist so create it
		routeDescriptor = {
			path: patternObj.path,
			pattern: pattern,
			path_vars: pathVars,
			expression: new RegExp(pattern),
			themes: {}
		};

		//set them in storage
		RequestHandler.index[pattern] = RequestHandler.storage.length;
		RequestHandler.storage.push(routeDescriptor);
	}

	//set the descriptor for the theme and load the controller type
	routeDescriptor.themes[theme]            = descriptor;
	routeDescriptor.themes[theme].controller = require(descriptor.controller);

	pb.log.debug("RequestHandler: Registered Route - Theme ["+theme+"] Path ["+descriptor.path+"] Pattern ["+pattern+"]");
	return true;
};

RequestHandler.getRoutePattern = function(path) {
	if (!path) {
		return null;
	}

	//clean up path
	if (path.indexOf('/') == 0) {
		path = path.substring(1);
	}
	if (path.lastIndexOf('/') == path.length - 1) {
		path = path.substring(0, path.length - 1);
	}

	//construct the pattern & extract path variables
	var pathVars = {};
	var pattern = '^';
	var pathPieces = path.split('/');
	for (var i = 0; i < pathPieces.length; i++) {
		var piece = pathPieces[i];

		if (piece.indexOf(':') == 0) {
			var fieldName = piece.substring(1);
			pathVars[fieldName] = i + 1;
			pattern += '/[A-Za-z0-9_\-]+';
		}
		else {
			if (piece.indexOf('*') >= 0) {
				piece = piece.replace(/\*/g, '.*');
			}
			pattern += '/'+piece;
		}
	}
	pattern += '[/]{0,1}$';

	return {
		path: path,
		pattern: pattern,
		pathVars: pathVars
	};
};

/**
 * Processes a request:
 * <ol>
 * 	<li>Initialize localization</li>
 * 	<li>if Public Route:
 * 		<ol>
 * 			<li>If Valid Content
 * 				<ol><li>Serve Public Content</li></ol>
 * 			</li>
 * 			<li>Else Serve 404</li>
 * 		</ol>
 * 	</li>
 * 	<li>Else Parse Cookies</li>
 * 	<li>Open/Create a session</li>
 * 	<li>Get Route</li>
 *
 * </ol>
 * @method handleRequest
 */
RequestHandler.prototype.handleRequest = function(){

	//get locale preference
	this.localizationService = new pb.Localization(this.req);

	//fist things first check for public resource
	if (RequestHandler.isPublicRoute(this.url.pathname)) {
		this.servePublicContent();
		return;
	}

	//check for session cookie
	var cookies = RequestHandler.parseCookies(this.req);
	this.req.headers[pb.SessionHandler.COOKIE_HEADER] = cookies;

    //open session
	var self = this;
    pb.session.open(this.req, function(err, session){

    	//set the session id when no session has started or the current one has
    	//expired.
    	var sc = Object.keys(cookies).length == 0;
    	var se = !sc && cookies.session_id != session.uid;
    	self.setSessionCookie =  sc || se;
    	if (pb.log.isSilly()) {
    		pb.log.silly("RequestHandler: Session ID ["+session.uid+"] Cookie SID ["+cookies.session_id+"] Created ["+sc+"] Expired ["+se+"]");
    	}

    	//continue processing
    	self.onSessionRetrieved(err, session);
    });
};

RequestHandler.prototype.servePublicContent = function(absolutePath) {

	//check for provided path, then default if necessary
	if (absolutePath === undefined) {
		absolutePath = path.join(DOCUMENT_ROOT, 'public', this.url.pathname);
	}

	var self = this;
	fs.readFile(absolutePath, function(err, content){
		if (err) {
			self.serve404();
			return;
		}

		//build response structure
		var data = {
			content: content
		};

		//guess at content-type
		var map = {
			js: 'text/javascript',
			css: 'text/css',
			png: 'image/png',
			svg: 'image/svg+xml',
			jpg: 'image/jpeg',
			gif: 'image/gif',
			ico: 'image/vnd.microsoft.icon',
			tff: 'application/octet-stream',
			eot: 'application/vnd.ms-fontobject',
			woff: 'application/x-font-woff'
		};
		var index = absolutePath.lastIndexOf('.');
		if (index >= 0) {
			var mime = map[absolutePath.substring(index + 1)];
			if (mime != undefined) {
				data.content_type = mime;
			}
		}

		//send response
		self.writeResponse(data);
	});
};

/**
 *
 * @param path
 * @returns {Boolean}
 */
RequestHandler.isPublicRoute = function(path){
	var publicRoutes = ['/js/', '/css/', '/fonts/', '/img/', '/media/', '/localization/', '/favicon.ico'];
	for (var i = 0; i < publicRoutes.length; i++) {
		if (path.indexOf(publicRoutes[i]) == 0) {
			return true;
		}
	}
	return false;
};

RequestHandler.prototype.serve404 = function() {

	var NotFound  = require('../../controllers/error/404.js');
	var cInstance = new NotFound();
	this.doRender({}, cInstance);

	if (pb.log.isSilly()) {
		pb.log.silly("RequestHandler: No Route Found, Sending 404 for URL="+this.url.href);
	}
};

/**
 * TODO Church this up a bit.  Make it a template and controller like 404.
 * TODO install an encoder entity since node prints out function names in angle brackets
 * @param err
 */
RequestHandler.prototype.serveError = function(err) {
	var data = {
		content: '<html><body><h2>Whoops! Something unexpected happened.</h2><br/><pre>'+(err ? err.stack : '')+'</pre></body></html>',
		content_type: 'text/html',
		code: 500
	};
	this.onRenderComplete(data);
};

RequestHandler.prototype.onSessionRetrieved = function(err, session) {
	if (err) {
		this.onErrorOccurred(err);
		return;
	}

	//set the session
	this.session = session;

	//find the controller to hand off to
	var route = this.getRoute(this.url.pathname);
	if (route == null) {
		this.serve404();
		return;
	}
	this.route = route;

	//get active theme
	var self = this;
	pb.settings.get('active_theme', function(err, activeTheme){
		if (!activeTheme) {
			pb.log.warn("RequestHandler: The active theme is not set.  Defaulting to '%s'", RequestHandler.DEFAULT_THEME);
			activeTheme = RequestHandler.DEFAULT_THEME;
		}
		self.onThemeRetrieved(activeTheme, route);
	});
};

RequestHandler.prototype.getRoute = function(path) {

	var route = null;
	for (var i = 0; i < RequestHandler.storage.length; i++) {

		var curr   = RequestHandler.storage[i];

		//test method when exists
		if (curr.method !== undefined && curr.method !== this.req.method) {
			if (pb.log.isSilly()) {
				pb.log.silly('RequestHandler: Skipping Path ['+path+'] becuase Method ['+this.request.method+'] does not match ['+curr.method+']');
			}
			continue;
		}
		var result = curr.expression.test(path);

		if (pb.log.isSilly()) {
			pb.log.silly('RequestHandler: Comparing Path ['+path+'] to Pattern ['+curr.pattern+'] Result ['+result+']');
		}
		if (result) {
			route = curr;
			break;
		}
	}
	return route;
};

RequestHandler.prototype.onThemeRetrieved = function(activeTheme, route) {
	var self = this;

	//check for unregistered route for theme
	if (typeof route.themes[activeTheme] === 'undefined') {

		//try default route
		activeTheme = RequestHandler.DEFAULT_THEME;
		if (typeof route.themes[activeTheme] === 'undefined') {

			//custom route, just pull from first found
			for(var theme in route.themes) {
				activeTheme = theme;
				break;
			}
		}
	}

	if (pb.log.isSilly()) {
		pb.log.silly("RequestHandler: Settling on theme [%s] for URL=[%s]", activeTheme, this.url.href);
	}

	//sanity check
	if (typeof route.themes[activeTheme] === 'undefined') {
		this.serve404();
		return;
	}

	//do security checks
	this.checkSecurity(activeTheme, function(err, result) {
		if (pb.log.isSilly()) {
			pb.log.silly("RequestHandler: Security Result=[%s]", result.success);
			for (var key in result.results) {
				pb.log.silly("RequestHandler:"+key+': '+JSON.stringify(result.results[key]));
			}
		}
		//all good
		if (result.success) {
			self.onSecurityChecksPassed(activeTheme, route);
			return;
		}

		//handle failures through bypassing other processing and doing output
		self.onRenderComplete(err);
	});
};

RequestHandler.prototype.onSecurityChecksPassed = function(activeTheme, route) {

	//extract path variables
	var pathVars = {};
	var pathParts = this.url.pathname.split('/');
	for (var field in route.path_vars) {
		pathVars[field] = pathParts[route.path_vars[field]];
	}

	//execute controller
	var ControllerType  = route.themes[activeTheme].controller;
	var cInstance       = new ControllerType();
	this.doRender(pathVars, cInstance);
};

RequestHandler.prototype.doRender = function(pathVars, cInstance) {
	var self  = this;
	var props = {
	    request_handler: this,
		request: this.req,
		response: this.resp,
		session: this.session,
		localization_service: this.localizationService,
		path_vars: pathVars,
		query: this.url.query
	};
	cInstance.init(props, function(){
		self.onControllerInitialized(cInstance);
	});
};

RequestHandler.prototype.checkSecurity = function(activeTheme, cb){
	var self        = this;
	this.themeRoute = this.route.themes[activeTheme];

	//verify if setup is needed
	var checkSystemSetup = function(callback) {
		var result = {success: true};
		if (self.themeRoute.setup_required == undefined || self.themeRoute.setup_required == true) {
			pb.settings.get('system_initialized', function(err, isSetup){

				//verify system init
				if (!isSetup) {
					result.success = false;
					result.redirect = '/setup';
					callback(result, result);
					return;
				}
				callback(null, result);
			});
		}
		else {
			callback(null, result);
		}
	};

	var checkRequiresAuth = function(callback) {

		var result = {success: true};
		if (self.themeRoute.auth_required == true) {

			if (self.session.authentication.user_id == null || self.session.authentication.user_id == undefined) {
				result.success  = false;
				result.redirect = RequestHandler.isAdminURL(self.url.href) ? '/admin/login' : '/user/login';
				self.session.on_login = self.url.href;
				callback(result, result);
				return;
			}
			callback(null, result);
		}
		else{
			callback(null, result);
		}
	};

	var checkAdminLevel = function(callback) {

		var result = {success: true};
		if (self.themeRoute.access_level !== undefined) {

			if (self.session.authentication.admin_level < self.themeRoute.access_level) {
				result.success = false;
				result.content = '403 Forbidden';
				result.code    = 403;
				callback(result, result);
				return;
			}
			callback(null, result);
		}
		else{
			callback(null, result);
		}
	};

	var checkPermissions = function(callback) {

		var result   = {success: true};
		var reqPerms = self.themeRoute.permissions;
		var auth     = self.session.authentication;
		if (auth && auth.user && auth.access_level !== ACCESS_ADMINISTRATOR && auth.user.permissisions && util.isArray(reqPerms)) {

			var permMap = self.session.authentication.user.permissions;
			for(var i = 0; i < reqPerms.length; i++) {

				if (!permMap[reqPerms[i]]) {
					result.success = false;
					result.content = '403 Forbidden';
					result.code    = 403;
					callback(result, result);
					return;
				}
			}
			callback(null, result);
		}
		else{
			callback(null, result);
		}
	};

	var tasks = {
		checkSystemSetup: checkSystemSetup,
        checkRequiresAuth: checkRequiresAuth,
        checkAdminLevel: checkAdminLevel,
        checkPermissions: checkPermissions
	};
	async.series(tasks, function(err, results){
		if (err) {
			cb(err, {success: false, results: results});
			return;
		}

		cb(null, {success: true, results: results});
	});
};

RequestHandler.prototype.onControllerInitialized = function(controller) {
	var self = this;
	process.nextTick(function() {
		try {
			controller.render(function(result){
				self.onRenderComplete(result);
			});
		}
		catch(err) {
			pb.log.error(err.toString()+"\n"+err.stack);
			self.serveError(err);
		}
	});
};

RequestHandler.prototype.onRenderComplete = function(data){

	//set cookie
    var cookies = new Cookies(this.req, this.resp);
    if (this.setSessionCookie) {
    	try{
    		cookies.set(pb.SessionHandler.COOKIE_NAME, this.session.uid, pb.SessionHandler.getSessionCookie(this.session));
    	}
    	catch(e){
    		pb.log.error('RequestHandler: %s', e.stack);
    	}
    }

	//do any necessary redirects
	var doRedirect = typeof data.redirect != "undefined";
	if(doRedirect) {
        this.doRedirect(data.redirect);
    }
	else {
		//output data here
		this.writeResponse(data);
	}

	//calculate response time
	if (pb.log.isDebug()) {
		pb.log.debug("Response Time: "+(new Date().getTime() - this.startTime)+
				"ms URL=["+this.req.method+']'+
				this.req.url+(doRedirect ? ' Redirect='+data.redirect : '') +
				(data.code == undefined ? '' : ' CODE='+data.code));
	}

	//close session after data sent
	//public content doesn't require a session so in order to not error out we
	//check if the session exists first.
	if (this.session) {
		pb.session.close(this.session, function(err, result) {
			//TODO handle any errors
		});
	}
};

RequestHandler.prototype.writeResponse = function(data){

    //infer a response code when not provided
    if(typeof data.code === 'undefined'){
        data.code = 200;
    }

    // If a response code other than 200 is provided, force that code into the head
    var contentType = 'text/html';
    if (typeof data.content_type !== 'undefined') {
    	contentType = data.content_type;
    }
    else if (this.themeRoute && this.themeRoute.content_type != undefined) {
    	contentType = this.themeRoute.content_type;
    }

    //send response
    //the catch allows us to prevent any plugins that callback trwice from
    //screwing us over due to the attempt to write headers twice.
    try {
    	//set any custom headers
    	if (pb.utils.isObject(data.headers)) {
    		for(var header in data.headers) {
    			this.resp.setHeader(header, data.headers[header]);
    		}
    	}
    	this.resp.setHeader('content-type', contentType);
    	this.resp.writeHead(data.code);
    	this.resp.end(data.content);
    }
    catch(e) {
    	pb.log.error('RequestHandler: '+e.stack);
    }
};


RequestHandler.prototype.writeCookie = function(descriptor, cookieStr){
	cookieStr = cookieStr ? cookieStr : '';

	for(var key in descriptor) {
        cookieStr += key + '=' + descriptor[key]+'; ';
    }
	return cookieStr;
};

RequestHandler.prototype.doRedirect = function(location) {
	this.resp.statusCode = 302;
    this.resp.setHeader("Location", location);
    this.resp.end();
};

RequestHandler.prototype.onErrorOccurred = function(err){
	var error = new PBError("Failed to open a session", 500);
	error.setSource(err);
	throw error;
};

RequestHandler.parseCookies = function(req){

	var parsedCookies = {};
	if (req.headers.cookie) {

        var cookieParameters = req.headers.cookie.split(';');
        for(var i = 0; i < cookieParameters.length; i++)  {

        	var keyVal = cookieParameters[i].split('=');
            parsedCookies[keyVal[0]] = keyVal[1];
        }
	}
    return parsedCookies;
};

RequestHandler.urlExists = function(url, id, cb) {
	var dao = new pb.DAO();
	var getTask = function(collection) {
		return function (callback) {
			var where = {url: url};
			if (id) {
				where._id = {$ne: new ObjectID(id)};
			}
			dao.count(collection, where, function(err, count) {
                if(util.isError(err) || count > 0) {
                    callback(true, count);
                }
                else {
                	callback(null, count);
                }
			});
		};
	};
	async.series([getTask('article'), getTask('page')], function(err, results){
		cb(err, err != null);
	});
};

RequestHandler.isAdminURL = function(url) {
	if (url != null) {

		var index = url.indexOf('/');
		if (index == 0 && url.length > 0) {
			url = url.substring(1);
		}

		var pieces = url.split('/');
		return pieces.length > 0 && pieces[0].indexOf('admin') == 0;
	}
	return false;
};

RequestHandler.isSystemSafeURL = function(url, id, cb) {
	if (url == null || RequestHandler.isAdminURL(url)) {
		cb(null, false);
		return;
	}
	RequestHandler.urlExists(url, id, function(err, exists){
		cb(err, !exists);
	});
};

module.exports.RequestHandler = RequestHandler;
