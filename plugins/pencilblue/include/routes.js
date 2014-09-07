/*
    Copyright (C) 2014  PencilBlue, LLC

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
module.exports = [
    {
        method: 'get',
        path: '/media/*',
        auth_required: false,
        controller: path.join(DOCUMENT_ROOT, 'controllers', 'media_content_controller.js')
    },
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
    	path: "/actions/user/reset_password",
    	access_level: 0,
    	auth_required: false,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'user', 'reset_password.js'),
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
    	method: 'get',
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
    	method: 'post',
    	path: "/actions/admin/site_settings/configuration",
    	access_level: ACCESS_ADMINISTRATOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'admin', 'site_settings', 'configuration.js'),
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
		path: "/admin/site_settings/libraries",
		access_level: ACCESS_ADMINISTRATOR,
		auth_required: true,
		controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'site_settings', 'libraries.js'),
		content_type: 'text/html'
	},
	{
		method: 'post',
		path: "/actions/admin/site_settings/libraries",
		access_level: ACCESS_ADMINISTRATOR,
		auth_required: true,
		controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'admin', 'site_settings', 'libraries.js'),
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
    	method: 'get',
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
    	method: 'get',
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
    	method: 'get',
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
        method: 'post',
    	path: "/actions/admin/content/custom_objects/new_object_type",
    	access_level: ACCESS_EDITOR,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'admin', 'content', 'custom_objects', 'new_object_type.js'),
    	content_type: 'text/html'
    },
    {
    	method: 'get',
    	path: "/admin/content/custom_objects/edit_object_type/:id",
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
        method: 'post',
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
        method: 'get',
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
        path: "/admin/users/unverified_users",
        auth_required: true,
        access_level: ACCESS_EDITOR,
        controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'users', 'unverified_users.js'),
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
        path: "/actions/admin/users/delete_user/:id",
        auth_required: true,
        access_level: ACCESS_EDITOR,
        controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'admin', 'users', 'delete_user.js'),
    },
    {
        method: 'get',
        path: "/actions/admin/users/delete_unverified_user/:id",
        auth_required: true,
        access_level: ACCESS_EDITOR,
        controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'admin', 'users', 'delete_unverified_user.js'),
    },
    {
        method: 'get',
        path: "/actions/admin/users/verify_user/:id",
        auth_required: true,
        access_level: ACCESS_EDITOR,
        controller: path.join(DOCUMENT_ROOT, 'controllers', 'actions', 'admin', 'users', 'verify_user.js'),
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
    	path: "/admin/content/custom_objects/manage_objects/:id",
    	access_level: ACCESS_EDITOR,
    	auth_required: true,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'admin', 'content', 'custom_objects', 'manage_objects.js'),
    	content_type: 'text/html'
    },
    {
    	path: "/admin/content/custom_objects/sort_objects/:type_id",
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
    	path: "/admin/content/custom_objects/new_object/:type_id",
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
        method: 'get',
    	path: "/actions/admin/content/custom_objects/delete_object/:id",
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
    	method: 'post',
        path: "/api/cluster/:action",
        auth_required: true,
        access_level: ACCESS_ADMINISTRATOR,
        controller: path.join(DOCUMENT_ROOT, 'controllers', 'api', 'admin', 'system', 'cluster_api.js'),
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
    {
    	method: 'post',
    	path: "/api/jobs/:action/:id",
    	auth_required: true,
    	access_level: ACCESS_ADMINISTRATOR,
    	controller: path.join(DOCUMENT_ROOT, 'controllers', 'api', 'jobs', 'job_api_controller.js'),
    	content_type: 'application/json'
    },
    {
        method: 'post',
        path: "/api/admin/site_settings/email/send_test",
        auth_required: true,
        access_level: ACCESS_ADMINISTRATOR,
        controller: path.join(DOCUMENT_ROOT, 'controllers', 'api', 'admin', 'site_settings', 'email', 'send_test.js'),
        content_type: 'application/json'
    }
];
