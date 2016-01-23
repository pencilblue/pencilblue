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

//exports
module.exports = function Routes(pb){
    return [
        {
            method: 'get',
            path: '/media/*',
            auth_required: false,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'media_content_controller.js')
        },
        {
            method: 'get',
            path: "/public/:plugin/*",
            access_level: 0,
            auth_required: false,
            setup_required: false,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'public.js'),
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: "/setup",
            access_level: 0,
            auth_required: false,
            setup_required: false,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'setup.js'),
            content_type: 'text/html'
        },
        {
            method: 'post',
            path: "/actions/setup",
            access_level: 0,
            auth_required: false,
            setup_required: false,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'setup.js'),
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: "/admin/login",
            access_level: 0,
            auth_required: false,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'login.js'),
            content_type: 'text/html'
        },
        {
            method: 'post',
            path: "/actions/login",
            access_level: 0,
            auth_required: false,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'login.js'),
            content_type: 'text/html'
        },
        {
            method: 'post',
            path: "/actions/admin/sites/auth_token/:siteid",
            access_level: pb.SecurityService.ACCESS_MANAGING_EDITOR,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'sites', 'auth_token.js'),
            content_type: 'application/json'
        },
        {
            method: 'get',
            path: "/actions/admin/sites/token_login",
            auth_required: false,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'sites', 'token_login.js'),
            content_type: 'application/json'
        },
        {
            method: 'post',
            path: "/actions/forgot_password",
            access_level: 0,
            auth_required: false,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'forgot_password.js'),
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: "/actions/user/reset_password",
            access_level: 0,
            auth_required: false,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'user', 'reset_password.js'),
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: "/admin",
            access_level: pb.SecurityService.ACCESS_WRITER,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'index.js'),
            content_type: 'text/html'
        },
        {
            path: "/actions/logout",
            access_level: 0,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'logout.js'),
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: '/',
            access_level: 0,
            auth_required: false,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'blog.js'),
            content_type: 'text/html',
            localization: true
        },
        {
            method: 'get',
            path: "/preview/:type/:id",
            access_level: pb.SecurityService.ACCESS_WRITER,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'preview.js'),
            content_type: 'text/html'
        },
        {
            method: 'post',
            path: "/actions/user/manage_account/change_password",
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'user', 'manage_account', 'change_password.js'),
        },
        {
            method: 'post',
            path: "/actions/user/manage_account/profile",
            handler: 'put',
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'user', 'manage_account', 'profile.js'),
            content_type: 'application/json',
            request_body: ['application/json']
        },
        {
            method: 'post',
            path: "/actions/user/resend_verification",
            auth_required: false,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'user', 'resend_verification.js'),
            request_body: "application/json"
        },
        {
            method: 'post',
            path: "/actions/user/sign_up",
            auth_required: false,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'user', 'sign_up.js'),
        },
        {
            method: 'get',
            path: "/actions/user/verify_email",
            auth_required: false,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'user', 'verify_email.js'),
        },
        {
            method: 'get',
            path: "/sitemap",
            auth_required: false,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'sitemap.js'),
            content_type: 'application/xml'
        },
        {
            method: 'get',
            path: "/robots.txt",
            auth_required: false,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'robots.js'),
            content_type: 'text/plain'
        },
        {
            method: 'get',
            path: "/user/sign_up",
            auth_required: false,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'user', 'sign_up.js'),
        },
        {
            method: 'get',
            path: "/api/user/get_username_available",
            auth_required: false,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'api', 'user', 'get_username_available.js'),
            content_type: 'application/json'
        },
        {
            method: 'get',
            handler: 'login',
            path: "/user/login",
            auth_required: false,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'user', 'login.js'),
        },
        {
            method: 'get',
            path: "/feed",
            auth_required: false,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'feed.js'),
            content_type: 'application/rss+xml'
        },
        {
            method: 'get',
            path: "/section/:customUrl",
            auth_required: false,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'section.js'),
            content_type: 'text/html',
            localization: true
        },
        {
            method: 'get',
            path: "/article/:customUrl",
            auth_required: false,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'article.js'),
            content_type: 'text/html',
            localization: true
        },
        {
            method: 'get',
            path: "/page/:customUrl",
            auth_required: false,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'page.js'),
            content_type: 'text/html',
            localization: true
        },
        {
            method: 'post',
            path: "/api/comments/new_comment",
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'api', 'comments', 'new_comment.js'),
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: "/user/change_password",
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'user', 'change_password.js'),
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: "/user/manage_account",
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'user', 'manage_account.js'),
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: "/user/resend_verification",
            auth_required: false,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'user', 'resend_verification.js'),
            content_type: 'text/html'
        },

        {
            method: 'get',
            path: "/admin/users/permissions",
            auth_required: true,
            inactive_site_access: true,
            access_level: pb.SecurityService.ACCESS_ADMINISTRATOR,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'users', 'permissions.js'),
            content_type: 'text/html'
        },
        {
            path: "/api/content/get_articles",
            auth_required: false,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'api', 'content', 'get_articles.js'),
            content_type: 'application/json'
        },
        {
            path: "/api/content/get_media_embed",
            auth_required: false,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'api', 'content', 'get_media_embed.js'),
            content_type: 'application/json'
        },
        {
            method: 'get',
            path: "/api/url/:action",
            auth_required: true,
            inactive_site_access: true,
            access_level: pb.SecurityService.ACCESS_WRITER,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'api', 'admin', 'url_api.js'),
            content_type: 'application/json'
        },
        {
            method: 'get',
            path: "/api/content/search",
            auth_required: true,
            inactive_site_access: true,
            access_level: pb.SecurityService.ACCESS_WRITER,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'api', 'content', 'search.js'),
            content_type: 'application/json'
        },
        {
            method: 'post',
            handler: 'refresh',
            path: "/api/cluster/refresh",
            auth_required: true,
            access_level: pb.SecurityService.ACCESS_ADMINISTRATOR,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'api', 'admin', 'system', 'cluster_api.js'),
            content_type: 'application/json'
        },
        {
            method: 'get',
            handler: 'getAll',
            path: "/api/cluster",
            auth_required: true,
            inactive_site_access: true,
            access_level: pb.SecurityService.ACCESS_ADMINISTRATOR,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'api', 'admin', 'system', 'cluster_api.js'),
            content_type: 'application/json'
        },
        {
            method: 'post',
            path: "/api/jobs/:action/:id",
            auth_required: true,
            inactive_site_access: true,
            access_level: pb.SecurityService.ACCESS_ADMINISTRATOR,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'api', 'jobs', 'job_api_controller.js'),
            content_type: 'application/json'
        },
        {
            method: 'post',
            path: "/api/admin/site_settings/email/send_test",
            auth_required: true,
            inactive_site_access: true,
            access_level: pb.SecurityService.ACCESS_ADMINISTRATOR,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'api', 'admin', 'site_settings', 'email', 'send_test.js'),
            content_type: 'application/json'
        },



        // NAVIGATION
        {
            method: 'get',
            path: "/admin/content/navigation",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'content', 'navigation', 'nav_map.js'),
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: "/admin/content/navigation/new",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'content', 'navigation', 'nav_item_form.js'),
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: "/admin/content/navigation/:id",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'content', 'navigation', 'nav_item_form.js'),
            content_type: 'text/html'
        },
        {
            method: 'post',
            path: "/actions/admin/content/navigation/map",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'content', 'navigation', 'nav_map.js'),
            content_type: 'text/html'
        },
        {
            method: 'post',
            path: "/actions/admin/content/navigation",
            handler: 'post',
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'content', 'navigation', 'new_nav_item.js'),
            content_type: 'text/html'
        },
        {
            method: 'post',
            path: "/actions/admin/content/navigation/:id",
            handler: 'put',
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'content', 'navigation', 'new_nav_item.js'),
            content_type: 'text/html'
        },
        {
            method: 'delete',
            path: "/actions/admin/content/navigation/:id",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'content', 'navigation', 'delete_nav_item.js'),
            content_type: 'text/html'
        },

        // TOPICS
        {
            method: 'get',
            path: "/admin/content/topics",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'content', 'topics', 'manage_topics.js'),
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: "/admin/content/topics/new",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'content', 'topics', 'topic_form.js'),
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: "/admin/content/topics/import",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'content', 'topics', 'import_topics.js'),
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: "/admin/content/topics/:id",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'content', 'topics', 'topic_form.js'),
            content_type: 'text/html'
        },
        {
            method: 'post',
            path: "/actions/admin/content/topics",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'content', 'topics', 'new_topic.js'),
            content_type: 'text/html'
        },
        {
            method: 'post',
            path: "/actions/admin/content/topics/import",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'content', 'topics', 'import_topics.js'),
            content_type: 'text/html'
        },
        {
            method: 'post',
            path: "/actions/admin/content/topics/:id",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'content', 'topics', 'edit_topic.js'),
            content_type: 'text/html'
        },

        // ARTICLES
        {
            method: 'get',
            path: "/admin/content/articles",
            access_level: pb.SecurityService.ACCESS_WRITER,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'content', 'articles', 'manage_articles.js'),
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: "/admin/content/articles/new",
            access_level: pb.SecurityService.ACCESS_WRITER,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'content', 'articles', 'article_form.js'),
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: "/admin/content/articles/:id",
            access_level: pb.SecurityService.ACCESS_WRITER,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'content', 'articles', 'article_form.js'),
            content_type: 'text/html'
        },
        {
            method: 'post',
            path: "/actions/admin/content/articles",
            access_level: pb.SecurityService.ACCESS_WRITER,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'content', 'articles', 'new_article.js'),
            content_type: 'text/html'
        },
        {
            method: 'post',
            path: "/actions/admin/content/articles/:id",
            access_level: pb.SecurityService.ACCESS_WRITER,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'content', 'articles', 'edit_article.js'),
            content_type: 'text/html'
        },

        // PAGES
        {
            method: 'get',
            path: "/admin/content/pages",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'content', 'pages', 'manage_pages.js'),
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: "/admin/content/pages/new",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'content', 'pages', 'page_form.js'),
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: "/admin/content/pages/:id",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'content', 'pages', 'page_form.js'),
            content_type: 'text/html'
        },
        {
            method: 'post',
            path: "/actions/admin/content/pages",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'content', 'pages', 'new_page.js'),
            content_type: 'text/html'
        },
        {
            method: 'post',
            path: "/actions/admin/content/pages/:id",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'content', 'pages', 'edit_page.js'),
            content_type: 'text/html'
        },

        // MEDIA
        {
            method: 'get',
            path: "/admin/content/media",
            access_level: pb.SecurityService.ACCESS_WRITER,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'content', 'media', 'manage_media.js'),
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: "/admin/content/media/new",
            access_level: pb.SecurityService.ACCESS_WRITER,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'content', 'media', 'media_form.js'),
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: "/admin/content/media/:id",
            access_level: pb.SecurityService.ACCESS_WRITER,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'content', 'media', 'media_form.js'),
            content_type: 'text/html'
        },
        {
            method: 'post',
            path: "/actions/admin/content/media",
            access_level: pb.SecurityService.ACCESS_WRITER,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'content', 'media', 'new_media.js'),
            content_type: 'text/html'
        },
        {
            method: 'post',
            path: "/actions/admin/content/media/:id",
            access_level: pb.SecurityService.ACCESS_WRITER,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'content', 'media', 'edit_media.js'),
            content_type: 'text/html'
        },
        {
            method: 'delete',
            path: "/actions/admin/content/media/:id",
            access_level: pb.SecurityService.ACCESS_WRITER,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'content', 'media', 'delete_media.js'),
            content_type: 'text/html'
        },
        {
            method: 'post',
            path: "/api/admin/content/media/upload_media",
            access_level: pb.SecurityService.ACCESS_WRITER,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'api', 'admin', 'content', 'media', 'upload_media.js'),
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: "/api/admin/content/media/get_link",
            access_level: pb.SecurityService.ACCESS_USER,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'api', 'admin', 'content', 'media', 'get_link.js'),
            content_type: 'application/json'
        },
        {
            method: 'get',
            path: "/api/admin/content/media/get_preview",
            access_level: pb.SecurityService.ACCESS_USER,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'api', 'admin', 'content', 'media', 'get_preview.js'),
            content_type: 'application/json'
        },

        // COMMENTS
        {
            method: 'get',
            path: "/admin/content/comments",
            auth_required: true,
            inactive_site_access: true,
            access_level: pb.SecurityService.ACCESS_EDITOR,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'content', 'comments', 'manage_comments.js'),
            content_type: 'text/html'
        },
        {
            method: 'delete',
            path: "/actions/admin/content/comments/:id",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'content', 'comments', 'delete_comment.js'),
            content_type: 'text/html'
        },

        // CUSTOM OBJECT TYPES
        {
            method: 'get',
            path: "/admin/content/objects/types",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'content', 'objects', 'types', 'manage_types.js'),
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: "/admin/content/objects/types/new",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'content', 'objects', 'types', 'type_form.js'),
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: "/admin/content/objects/types/:id",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'content', 'objects', 'types', 'type_form.js'),
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: "/api/admin/content/objects/types/available",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'api', 'admin', 'content', 'objects', 'types', 'available.js'),
            content_type: 'text/html'
        },
        {
            method: 'post',
            path: "/actions/admin/content/objects/types",
            inactive_site_access: true,
            access_level: pb.SecurityService.ACCESS_EDITOR,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'content', 'objects', 'types', 'new_type.js'),
            content_type: 'text/html',
            request_body: ['application/json']
        },
        {
            method: 'post',
            path: "/actions/admin/content/objects/types/:id",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'content', 'objects', 'types', 'edit_type.js'),
            content_type: 'text/html',
            request_body: ['application/json']
        },
        {
            method: 'delete',
            path: "/actions/admin/content/objects/types/:id",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'content', 'objects', 'types', 'delete_type.js'),
            content_type: 'text/html'
        },

        // CUSTOM OBJECTS
        {
            path: "/admin/content/objects/:type_id",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'content', 'objects', 'manage_objects.js'),
            content_type: 'text/html'
        },
        {
            path: "/admin/content/objects/:type_id/sort",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'content', 'objects', 'sort_objects.js'),
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: "/admin/content/objects/:type_id/new",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'content', 'objects', 'object_form.js'),
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: "/admin/content/objects/:type_id/:id",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'content', 'objects', 'object_form.js'),
            content_type: 'text/html'
        },
        {
            method: 'post',
            path: "/actions/admin/content/objects/:type_id/sort",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'content', 'objects', 'sort_objects.js'),
            content_type: 'text/html',
            request_body: ['application/json']
        },
        {
            method: 'post',
            path: "/actions/admin/content/objects/:type_id",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'content', 'objects', 'new_object.js'),
            content_type: 'text/html',
            request_body: ['application/json']
        },
        {
            method: 'post',
            path: "/actions/admin/content/objects/:type_id/:id",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'content', 'objects', 'edit_object.js'),
            content_type: 'text/html',
            request_body: ['application/json']
        },
        {
            method: 'delete',
            path: "/actions/admin/content/objects/:id",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'content', 'objects', 'delete_object.js'),
            content_type: 'text/html'
        },

        // PLUGINS
        {
            method: 'get',
            path: "/admin/plugins",
            auth_required: true,
            inactive_site_access: true,
            access_level: pb.SecurityService.ACCESS_ADMINISTRATOR,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'plugins', 'manage_plugins.js'),
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: "/admin/plugins/:id",
            auth_required: true,
            inactive_site_access: true,
            access_level: pb.SecurityService.ACCESS_ADMINISTRATOR,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'plugins', 'plugin_details.js'),
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: "/admin/plugins/:id/settings",
            handler: 'get',
            auth_required: true,
            inactive_site_access: true,
            access_level: pb.SecurityService.ACCESS_ADMINISTRATOR,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'plugins', 'plugin_settings.js'),
            content_type: 'text/html'
        },
        {
            method: 'post',
            path: "/admin/plugins/:id/settings",
            handler: 'post',
            auth_required: true,
            inactive_site_access: true,
            access_level: pb.SecurityService.ACCESS_ADMINISTRATOR,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'plugins', 'plugin_settings.js'),
            content_type: 'application/json',
            request_body: ['application/json']
        },
        {
            method: 'post',
            path: "/api/plugins/:action/:id",
            auth_required: true,
            inactive_site_access: true,
            access_level: pb.SecurityService.ACCESS_ADMINISTRATOR,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'api', 'plugins', 'plugin_api.js'),
            content_type: 'application/json'
        },

        // THEMES
        {
            method: 'get',
            path: "/admin/themes",
            auth_required: true,
            inactive_site_access: true,
            access_level: pb.SecurityService.ACCESS_ADMINISTRATOR,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'themes', 'manage_themes.js'),
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: "/admin/themes/:id/settings",
            handler: 'get',
            auth_required: true,
            inactive_site_access: true,
            access_level: pb.SecurityService.ACCESS_ADMINISTRATOR,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'themes', 'theme_settings.js'),
            content_type: 'text/html'
        },
        {
            method: 'post',
            path: "/admin/themes/:id/settings",
            handler: 'post',
            auth_required: true,
            inactive_site_access: true,
            access_level: pb.SecurityService.ACCESS_ADMINISTRATOR,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'themes', 'theme_settings.js'),
            content_type: 'application/json',
            request_body: ['application/json']
        },
        {
            method: 'post',
            path: "/actions/admin/themes/site_logo",
            auth_required: true,
            inactive_site_access: true,
            access_level: pb.SecurityService.ACCESS_ADMINISTRATOR,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'themes', 'site_logo.js'),
        },

        // USERS
        {
            method: 'get',
            path: "/admin/users",
            auth_required: true,
            inactive_site_access: true,
            access_level: pb.SecurityService.ACCESS_EDITOR,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'users', 'manage_users.js'),
        },
        {
            method: 'get',
            path: "/admin/users/unverified",
            auth_required: true,
            inactive_site_access: true,
            access_level: pb.SecurityService.ACCESS_EDITOR,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'users', 'unverified_users.js'),
        },
        {
            method: 'get',
            path: "/admin/users/new",
            auth_required: true,
            inactive_site_access: true,
            access_level: pb.SecurityService.ACCESS_EDITOR,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'users', 'user_form.js'),
        },
        {
            method: 'get',
            path: "/admin/users/:id",
            auth_required: true,
            inactive_site_access: true,
            access_level: pb.SecurityService.ACCESS_EDITOR,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'users', 'user_form.js'),
        },
        {
            method: 'get',
            path: "/admin/users/password/:id",
            auth_required: true,
            inactive_site_access: true,
            access_level: pb.SecurityService.ACCESS_EDITOR,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'users', 'change_password.js'),
        },
        {
            method: 'post',
            path: "/actions/admin/users",
            auth_required: true,
            inactive_site_access: true,
            access_level: pb.SecurityService.ACCESS_EDITOR,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'users', 'new_user.js'),
            content_type: 'application/json',
            request_body: ['application/json']
        },
        {
            method: 'post',
            path: "/actions/admin/users/:id",
            auth_required: true,
            inactive_site_access: true,
            access_level: pb.SecurityService.ACCESS_EDITOR,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'users', 'edit_user.js'),
            content_type: 'application/json',
            request_body: ['application/json']
        },
        {
            method: 'delete',
            path: "/actions/admin/users/:id",
            auth_required: true,
            inactive_site_access: true,
            access_level: pb.SecurityService.ACCESS_EDITOR,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'users', 'delete_user.js'),
        },
        {
            method: 'delete',
            path: "/actions/admin/users/unverified/:id",
            auth_required: true,
            inactive_site_access: true,
            access_level: pb.SecurityService.ACCESS_EDITOR,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'users', 'delete_unverified_user.js'),
        },
        {
            method: 'get',
            path: "/actions/admin/users/verify/:id",
            auth_required: true,
            inactive_site_access: true,
            access_level: pb.SecurityService.ACCESS_EDITOR,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'users', 'verify_user.js'),
        },
        {
            method: 'post',
            path: "/actions/admin/users/change_password/:id",
            auth_required: true,
            inactive_site_access: true,
            access_level: pb.SecurityService.ACCESS_EDITOR,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'users', 'change_password.js'),
        },
        {
            method: 'get',
            path: "/actions/admin/users/send_password_reset/:id",
            auth_required: true,
            inactive_site_access: true,
            access_level: pb.SecurityService.ACCESS_MANAGING_EDITOR,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'users', 'send_password_reset.js'),
        },
        {
            method: 'post',
            path: "/actions/admin/users/send_password_reset/:id",
            auth_required: true,
            inactive_site_access: true,
            access_level: pb.SecurityService.ACCESS_MANAGING_EDITOR,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'users', 'send_password_reset.js'),
        },

        // SITE SETTINGS
        {
            method: 'get',
            path: "/admin/site_settings",
            access_level: pb.SecurityService.ACCESS_ADMINISTRATOR,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'site_settings', 'configuration.js'),
            content_type: 'text/html'
        },
        {
            method: 'post',
            path: "/actions/admin/site_settings",
            access_level: pb.SecurityService.ACCESS_ADMINISTRATOR,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'site_settings', 'configuration.js'),
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: "/admin/site_settings/content",
            access_level: pb.SecurityService.ACCESS_ADMINISTRATOR,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'site_settings', 'content.js'),
            content_type: 'text/html'
        },
        {
            method: 'post',
            path: "/actions/admin/site_settings/content",
            access_level: pb.SecurityService.ACCESS_ADMINISTRATOR,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'site_settings', 'content.js'),
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: "/admin/site_settings/email",
            access_level: pb.SecurityService.ACCESS_ADMINISTRATOR,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'site_settings', 'email.js'),
            content_type: 'text/html'
        },
        {
            method: 'post',
            path: "/actions/admin/site_settings/email",
            access_level: pb.SecurityService.ACCESS_ADMINISTRATOR,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'site_settings', 'email.js'),
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: "/admin/site_settings/libraries",
            access_level: pb.SecurityService.ACCESS_ADMINISTRATOR,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'site_settings', 'libraries.js'),
            content_type: 'text/html'
        },
        {
            method: 'post',
            path: "/actions/admin/site_settings/libraries",
            access_level: pb.SecurityService.ACCESS_ADMINISTRATOR,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'site_settings', 'libraries.js'),
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: "/api/localization/script",
            handler: "getAsScript",
            auth_required: false,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'api', 'localization_controller.js'),
            content_type: 'text/javascript'
        },
        {
            method: 'get',
            path: "/admin/sites",
            access_level: pb.SecurityService.ACCESS_ADMINISTRATOR,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'sites', 'manage_sites.js'),
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: "/admin/sites/new",
            access_level: pb.SecurityService.ACCESS_ADMINISTRATOR,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'sites', 'site_form.js'),
            content_type: 'text/html',
            handler: 'new'
        },
        {
            method: 'get',
            path: "/admin/sites/:siteid",
            access_level: pb.SecurityService.ACCESS_ADMINISTRATOR,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'sites', 'site_form.js'),
            content_type: 'text/html',
            handler: 'edit'
        },
        {
            method: 'post',
            path: "/actions/admin/sites/new",
            access_level: pb.SecurityService.ACCESS_ADMINISTRATOR,
            auth_required: true,
            inactive_site_access: true,
            request_body: ['application/json'],
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'sites', 'new_site.js')
        },
        {
            method: 'post',
            path: "/actions/admin/sites/edit/:siteid",
            access_level: pb.SecurityService.ACCESS_ADMINISTRATOR,
            auth_required: true,
            inactive_site_access: true,
            request_body: ['application/json'],
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'sites', 'edit_site.js')
        },
        {
            method: 'delete',
            path: "/actions/admin/sites/delete/:siteid",
            content_type: 'application/json',
            access_level: pb.SecurityService.ACCESS_ADMINISTRATOR,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'sites', 'delete_site.js')
        },
        {
            method: 'post',
            path: "/actions/admin/sites/activate/:id",
            access_level: pb.SecurityService.ACCESS_ADMINISTRATOR,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'sites', 'activate_site.js')
        },
        {
            method: 'post',
            path: "/actions/admin/sites/deactivate/:id",
            access_level: pb.SecurityService.ACCESS_ADMINISTRATOR,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'sites', 'deactivate_site.js')
        },

        //**********************API************************

      	{
            method: 'get',
            path: "/admin/elements/wysiwyg",
            access_level: pb.SecurityService.ACCESS_WRITER,
            auth_required: true,
            inactive_site_access: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'elements', 'wysiwyg.js'),
      	},
        {
            handler: 'setLocale',
            path: "/user/locale",
            auth_required: false,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'user', 'locale_view_controller.js'),
      	},

        //articles
        {
            method: 'get',
            path: "/api/content/articles/:id",
            handler: "get",
            content_type: 'application/json',
            auth_required: true,
            inactive_site_access: true,
            access_level: pb.SecurityService.ACCESS_WRITER,
            controller: path.join(pb.config.docRoot, 'plugins/pencilblue/controllers/api/content/article_api_controller.js')
        },
        {
            method: 'get',
            path: "/api/content/articles",
            handler: "getAll",
            content_type: 'application/json',
            auth_required: true,
            inactive_site_access: true,
            access_level: pb.SecurityService.ACCESS_WRITER,
            controller: path.join(pb.config.docRoot, 'plugins/pencilblue/controllers/api/content/article_api_controller.js')
        },
        {
            method: 'delete',
            path: "/api/content/articles/:id",
            handler: "delete",
            content_type: 'application/json',
            auth_required: true,
            access_level: pb.SecurityService.ACCESS_EDITOR,
            controller: path.join(pb.config.docRoot, 'plugins/pencilblue/controllers/api/content/article_api_controller.js')
        },
        {
            method: 'post',
            path: "/api/content/articles",
            handler: "post",
            content_type: 'application/json',
            auth_required: true,
            inactive_site_access: true,
            access_level: pb.SecurityService.ACCESS_WRITER,
            controller: path.join(pb.config.docRoot, 'plugins/pencilblue/controllers/api/content/article_api_controller.js'),
            request_body: ['application/json']
        },
        {
            method: 'put',
            path: "/api/content/articles/:id",
            handler: "put",
            content_type: 'application/json',
            auth_required: true,
            access_level: pb.SecurityService.ACCESS_WRITER,
            controller: path.join(pb.config.docRoot, 'plugins/pencilblue/controllers/api/content/article_api_controller.js'),
            request_body: ['application/json']
        },
        {
            method: 'get',
            path: "/api/content/articles/:articleId/comments",
            handler: "getAllComments",
            content_type: 'application/json',
            auth_required: false,
            controller: path.join(pb.config.docRoot, 'plugins/pencilblue/controllers/api/content/article_api_controller.js')
        },
        {
            method: 'post',
            path: "/api/content/articles/:articleId/comments",
            handler: "addComment",
            content_type: 'application/json',
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins/pencilblue/controllers/api/content/article_api_controller.js'),
            request_body: ['application/json']
        },
        {
            method: 'delete',
            path: "/api/content/articles/:articleId/comments/:id",
            handler: "deleteComment",
            content_type: 'application/json',
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins/pencilblue/controllers/api/content/article_api_controller.js')
        },

        //topics
        {
            method: 'get',
            path: "/api/content/topics/:id",
            handler: "get",
            content_type: 'application/json',
            auth_required: true,
            access_level: pb.SecurityService.ACCESS_WRITER,
            controller: path.join(pb.config.docRoot, 'plugins/pencilblue/controllers/api/content/topic_api_controller.js')
        },
        {
            method: 'get',
            path: "/api/content/topics",
            handler: "getAll",
            content_type: 'application/json',
            auth_required: true,
            access_level: pb.SecurityService.ACCESS_WRITER,
            controller: path.join(pb.config.docRoot, 'plugins/pencilblue/controllers/api/content/topic_api_controller.js')
        },
        {
            method: 'delete',
            path: "/api/content/topics/:id",
            handler: "delete",
            content_type: 'application/json',
            auth_required: true,
            access_level: pb.SecurityService.ACCESS_EDITOR,
            controller: path.join(pb.config.docRoot, 'plugins/pencilblue/controllers/api/content/topic_api_controller.js')
        },
        {
            method: 'post',
            path: "/api/content/topics",
            handler: "post",
            content_type: 'application/json',
            auth_required: true,
            inactive_site_access: true,
            access_level: pb.SecurityService.ACCESS_EDITOR,
            controller: path.join(pb.config.docRoot, 'plugins/pencilblue/controllers/api/content/topic_api_controller.js'),
            request_body: ['application/json']
        },
        {
            method: 'put',
            path: "/api/content/topics/:id",
            handler: "put",
            content_type: 'application/json',
            auth_required: true,
            inactive_site_access: true,
            access_level: pb.SecurityService.ACCESS_EDITOR,
            controller: path.join(pb.config.docRoot, 'plugins/pencilblue/controllers/api/content/topic_api_controller.js'),
            request_body: ['application/json']
        },

        //pages
        {
            method: 'get',
            path: "/api/content/pages/:id",
            handler: "get",
            content_type: 'application/json',
            auth_required: true,
            inactive_site_access: true,
            access_level: pb.SecurityService.ACCESS_WRITER,
            controller: path.join(pb.config.docRoot, 'plugins/pencilblue/controllers/api/content/page_api_controller.js')
        },
        {
            method: 'get',
            path: "/api/content/pages",
            handler: "getAll",
            content_type: 'application/json',
            auth_required: true,
            inactive_site_access: true,
            access_level: pb.SecurityService.ACCESS_WRITER,
            controller: path.join(pb.config.docRoot, 'plugins/pencilblue/controllers/api/content/page_api_controller.js')
        },
        {
            method: 'delete',
            path: "/api/content/pages/:id",
            handler: "delete",
            content_type: 'application/json',
            auth_required: true,
            inactive_site_access: true,
            access_level: pb.SecurityService.ACCESS_EDITOR,
            controller: path.join(pb.config.docRoot, 'plugins/pencilblue/controllers/api/content/page_api_controller.js')
        },
        {
            method: 'post',
            path: "/api/content/pages",
            handler: "post",
            content_type: 'application/json',
            auth_required: true,
            inactive_site_access: true,
            access_level: pb.SecurityService.ACCESS_WRITER,
            controller: path.join(pb.config.docRoot, 'plugins/pencilblue/controllers/api/content/page_api_controller.js'),
            request_body: ['application/json']
        },
        {
            method: 'put',
            path: "/api/content/pages/:id",
            handler: "put",
            content_type: 'application/json',
            auth_required: true,
            inactive_site_access: true,
            access_level: pb.SecurityService.ACCESS_WRITER,
            controller: path.join(pb.config.docRoot, 'plugins/pencilblue/controllers/api/content/page_api_controller.js'),
            request_body: ['application/json']
        }
    ];
};
