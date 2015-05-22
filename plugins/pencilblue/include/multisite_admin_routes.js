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
            path: "/admin/:siteid",
            access_level: pb.SecurityService.ACCESS_WRITER,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'index.js'),
            content_type: 'text/html'
        },
        // NAVIGATION
        {
            method: 'get',
            path: "/admin/:siteid/content/navigation",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'content', 'navigation', 'nav_map.js'),
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: "/admin/:siteid/content/navigation/new",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'content', 'navigation', 'nav_item_form.js'),
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: "/admin/:siteid/content/navigation/:id",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'content', 'navigation', 'nav_item_form.js'),
            content_type: 'text/html'
        },
        {
            method: 'post',
            path: "/actions/admin/:siteid/content/navigation/map",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'content', 'navigation', 'nav_map.js'),
            content_type: 'text/html'
        },
        {
            method: 'post',
            path: "/actions/admin/:siteid/content/navigation",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'content', 'navigation', 'new_nav_item.js'),
            content_type: 'text/html'
        },
        {
            method: 'post',
            path: "/actions/admin/:siteid/content/navigation/:id",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'content', 'navigation', 'edit_nav_item.js'),
            content_type: 'text/html'
        },
        {
            method: 'delete',
            path: "/actions/admin/:siteid/content/navigation/:id",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'content', 'navigation', 'delete_nav_item.js'),
            content_type: 'text/html'
        },

        // TOPICS
        {
            method: 'get',
            path: "/admin/:siteid/content/topics",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'content', 'topics', 'manage_topics.js'),
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: "/admin/:siteid/content/topics/new",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'content', 'topics', 'topic_form.js'),
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: "/admin/:siteid/content/topics/import",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'content', 'topics', 'import_topics.js'),
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: "/admin/:siteid/content/topics/:id",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'content', 'topics', 'topic_form.js'),
            content_type: 'text/html'
        },
        {
            method: 'post',
            path: "/actions/admin/:siteid/content/topics",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'content', 'topics', 'new_topic.js'),
            content_type: 'text/html'
        },
        {
            method: 'post',
            path: "/actions/admin/:siteid/content/topics/import",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'content', 'topics', 'import_topics.js'),
            content_type: 'text/html'
        },
        {
            method: 'post',
            path: "/actions/admin/:siteid/content/topics/:id",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'content', 'topics', 'edit_topic.js'),
            content_type: 'text/html'
        },
        {
            method: 'delete',
            path: "/actions/admin/:siteid/content/topics/:id",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'content', 'topics', 'delete_topic.js'),
            content_type: 'text/html'
        },

        // ARTICLES
        {
            method: 'get',
            path: "/admin/:siteid/content/articles",
            access_level: pb.SecurityService.ACCESS_WRITER,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'content', 'articles', 'manage_articles.js'),
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: "/admin/:siteid/content/articles/new",
            access_level: pb.SecurityService.ACCESS_WRITER,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'content', 'articles', 'article_form.js'),
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: "/admin/:siteid/content/articles/:id",
            access_level: pb.SecurityService.ACCESS_WRITER,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'content', 'articles', 'article_form.js'),
            content_type: 'text/html'
        },
        {
            method: 'post',
            path: "/actions/admin/:siteid/content/articles",
            access_level: pb.SecurityService.ACCESS_WRITER,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'content', 'articles', 'new_article.js'),
            content_type: 'text/html'
        },
        {
            method: 'post',
            path: "/actions/admin/:siteid/content/articles/:id",
            access_level: pb.SecurityService.ACCESS_WRITER,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'content', 'articles', 'edit_article.js'),
            content_type: 'text/html'
        },
        {
            method: 'delete',
            path: "/actions/admin/:siteid/content/articles/:id",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'content', 'articles', 'delete_article.js')
        },

        // PAGES
        {
            method: 'get',
            path: "/admin/:siteid/content/pages",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'content', 'pages', 'manage_pages.js'),
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: "/admin/:siteid/content/pages/new",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'content', 'pages', 'page_form.js'),
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: "/admin/:siteid/content/pages/:id",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'content', 'pages', 'page_form.js'),
            content_type: 'text/html'
        },
        {
            method: 'post',
            path: "/actions/admin/:siteid/content/pages",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'content', 'pages', 'new_page.js'),
            content_type: 'text/html'
        },
        {
            method: 'post',
            path: "/actions/admin/:siteid/content/pages/:id",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'content', 'pages', 'edit_page.js'),
            content_type: 'text/html'
        },
        {
            method: 'delete',
            path: "/actions/admin/:siteid/content/pages/:id",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'content', 'pages', 'delete_page.js'),
            content_type: 'text/html'
        },

        // MEDIA
        {
            method: 'get',
            path: "/admin/:siteid/content/media",
            access_level: pb.SecurityService.ACCESS_WRITER,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'content', 'media', 'manage_media.js'),
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: "/admin/:siteid/content/media/new",
            access_level: pb.SecurityService.ACCESS_WRITER,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'content', 'media', 'media_form.js'),
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: "/admin/:siteid/content/media/:id",
            access_level: pb.SecurityService.ACCESS_WRITER,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'content', 'media', 'media_form.js'),
            content_type: 'text/html'
        },
        {
            method: 'post',
            path: "/actions/admin/:siteid/content/media",
            access_level: pb.SecurityService.ACCESS_WRITER,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'content', 'media', 'new_media.js'),
            content_type: 'text/html'
        },
        {
            method: 'post',
            path: "/actions/admin/:siteid/content/media/:id",
            access_level: pb.SecurityService.ACCESS_WRITER,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'content', 'media', 'edit_media.js'),
            content_type: 'text/html'
        },
        {
            method: 'delete',
            path: "/actions/admin/:siteid/content/media/:id",
            access_level: pb.SecurityService.ACCESS_WRITER,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'content', 'media', 'delete_media.js'),
            content_type: 'text/html'
        },
        {
            method: 'post',
            path: "/api/admin/:siteid/content/media/upload_media",
            access_level: pb.SecurityService.ACCESS_WRITER,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'api', 'admin', 'content', 'media', 'upload_media.js'),
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: "/api/admin/:siteid/content/media/get_link",
            access_level: pb.SecurityService.ACCESS_WRITER,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'api', 'admin', 'content', 'media', 'get_link.js'),
            content_type: 'application/json'
        },
        {
            method: 'get',
            path: "/api/admin/:siteid/content/media/get_preview",
            access_level: pb.SecurityService.ACCESS_WRITER,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'api', 'admin', 'content', 'media', 'get_preview.js'),
            content_type: 'application/json'
        },

        // COMMENTS
        {
            method: 'get',
            path: "/admin/:siteid/content/comments",
            auth_required: true,
            access_level: pb.SecurityService.ACCESS_EDITOR,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'content', 'comments', 'manage_comments.js'),
            content_type: 'text/html'
        },
        {
            method: 'delete',
            path: "/actions/admin/:siteid/content/comments/:id",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'content', 'comments', 'delete_comment.js'),
            content_type: 'text/html'
        },

        // CUSTOM OBJECT TYPES
        {
            method: 'get',
            path: "/admin/:siteid/content/objects/types",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'content', 'objects', 'types', 'manage_types.js'),
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: "/admin/:siteid/content/objects/types/new",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'content', 'objects', 'types', 'type_form.js'),
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: "/admin/:siteid/content/objects/types/:id",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'content', 'objects', 'types', 'type_form.js'),
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: "/api/admin/:siteid/content/objects/types/available",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'api', 'admin', 'content', 'objects', 'types', 'available.js'),
            content_type: 'text/html'
        },
        {
            method: 'post',
            path: "/actions/admin/:siteid/content/objects/types",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'content', 'objects', 'types', 'new_type.js'),
            content_type: 'text/html',
            request_body: ['application/json']
        },
        {
            method: 'post',
            path: "/actions/admin/:siteid/content/objects/types/:id",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'content', 'objects', 'types', 'edit_type.js'),
            content_type: 'text/html',
            request_body: ['application/json']
        },
        {
            method: 'delete',
            path: "/actions/admin/:siteid/content/objects/types/:id",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'content', 'objects', 'types', 'delete_type.js'),
            content_type: 'text/html'
        },

        // CUSTOM OBJECTS
        {
            path: "/admin/:siteid/content/objects/:type_id",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'content', 'objects', 'manage_objects.js'),
            content_type: 'text/html'
        },
        {
            path: "/admin/:siteid/content/objects/:type_id/sort",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'content', 'objects', 'sort_objects.js'),
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: "/admin/:siteid/content/objects/:type_id/new",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'content', 'objects', 'object_form.js'),
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: "/admin/:siteid/content/objects/:type_id/:id",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'content', 'objects', 'object_form.js'),
            content_type: 'text/html'
        },
        {
            method: 'post',
            path: "/actions/admin/:siteid/content/objects/:type_id/sort",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'content', 'objects', 'sort_objects.js'),
            content_type: 'text/html',
            request_body: ['application/json']
        },
        {
            method: 'post',
            path: "/actions/admin/:siteid/content/objects/:type_id",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'content', 'objects', 'new_object.js'),
            content_type: 'text/html',
            request_body: ['application/json']
        },
        {
            method: 'post',
            path: "/actions/admin/:siteid/content/objects/:type_id/:id",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'content', 'objects', 'edit_object.js'),
            content_type: 'text/html',
            request_body: ['application/json']
        },
        {
            method: 'delete',
            path: "/actions/admin/:siteid/content/objects/:id",
            access_level: pb.SecurityService.ACCESS_EDITOR,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'content', 'objects', 'delete_object.js'),
            content_type: 'text/html'
        },

        // PLUGINS
        {
            method: 'get',
            path: "/admin/:siteid/plugins",
            auth_required: true,
            access_level: pb.SecurityService.ACCESS_ADMINISTRATOR,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'plugins', 'manage_plugins.js'),
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: "/admin/:siteid/plugins/:id",
            auth_required: true,
            access_level: pb.SecurityService.ACCESS_ADMINISTRATOR,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'plugins', 'plugin_details.js'),
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: "/admin/:siteid/plugins/:id/settings",
            handler: 'get',
            auth_required: true,
            access_level: pb.SecurityService.ACCESS_ADMINISTRATOR,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'plugins', 'plugin_settings.js'),
            content_type: 'text/html'
        },
        {
            method: 'post',
            path: "/admin/:siteid/plugins/:id/settings",
            handler: 'post',
            auth_required: true,
            access_level: pb.SecurityService.ACCESS_ADMINISTRATOR,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'plugins', 'plugin_settings.js'),
            content_type: 'application/json',
            request_body: ['application/json']
        },
        {
            method: 'post',
            path: "/api/:siteid/plugins/:action/:id/",
            auth_required: true,
            access_level: pb.SecurityService.ACCESS_ADMINISTRATOR,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'api', 'plugins', 'plugin_api.js'),
            content_type: 'application/json'
        },

        // THEMES
        {
            method: 'get',
            path: "/admin/:siteid/themes",
            auth_required: true,
            access_level: pb.SecurityService.ACCESS_ADMINISTRATOR,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'themes', 'manage_themes.js'),
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: "/admin/:siteid/themes/:id/settings",
            handler: 'get',
            auth_required: true,
            access_level: pb.SecurityService.ACCESS_ADMINISTRATOR,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'themes', 'theme_settings.js'),
            content_type: 'text/html'
        },
        {
            method: 'post',
            path: "/admin/:siteid/themes/:id/settings",
            handler: 'post',
            auth_required: true,
            access_level: pb.SecurityService.ACCESS_ADMINISTRATOR,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'themes', 'theme_settings.js'),
            content_type: 'application/json',
            request_body: ['application/json']
        },
        {
            method: 'post',
            path: "/actions/admin/:siteid/themes/site_logo",
            auth_required: true,
            access_level: pb.SecurityService.ACCESS_ADMINISTRATOR,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'themes', 'site_logo.js')
        },

        //SITE SETTINGS
        {
            method: 'get',
            path: "/admin/:siteid/site_settings",
            access_level: pb.SecurityService.ACCESS_ADMINISTRATOR,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'site_settings', 'configuration.js'),
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: "/admin/:siteid/site_settings/content",
            access_level: pb.SecurityService.ACCESS_ADMINISTRATOR,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'site_settings', 'content.js'),
            content_type: 'text/html'
        },
        {
            method: 'post',
            path: "/actions/admin/:siteid/site_settings/content",
            access_level: pb.SecurityService.ACCESS_ADMINISTRATOR,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'site_settings', 'content.js'),
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: "/admin/:siteid/site_settings/email",
            access_level: pb.SecurityService.ACCESS_ADMINISTRATOR,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'site_settings', 'email.js'),
            content_type: 'text/html'
        },
        {
            method: 'post',
            path: "/actions/admin/:siteid/site_settings/email",
            access_level: pb.SecurityService.ACCESS_ADMINISTRATOR,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'site_settings', 'email.js'),
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: "/admin/"+ pb.SiteService.GLOBAL_SITE + "/site_settings/libraries",
            access_level: pb.SecurityService.ACCESS_ADMINISTRATOR,
            auth_required: true,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'site_settings', 'libraries.js'),
            content_type: 'text/html'
        },
        //USERS
        {
            method: 'get',
            path: "/admin/:siteid/users",
            auth_required: true,
            access_level: pb.SecurityService.ACCESS_EDITOR,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'users', 'manage_users.js')
        },
        {
            method: 'get',
            path: "/admin/:siteid/users/unverified",
            auth_required: true,
            access_level: pb.SecurityService.ACCESS_EDITOR,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'users', 'unverified_users.js')
        },
        {
            method: 'get',
            path: "/admin/:siteid/users/new",
            auth_required: true,
            access_level: pb.SecurityService.ACCESS_EDITOR,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'users', 'user_form.js')
        },
        {
            method: 'get',
            path: "/admin/:siteid/users/:id",
            auth_required: true,
            access_level: pb.SecurityService.ACCESS_EDITOR,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'users', 'user_form.js')
        },
        {
            method: 'get',
            path: "/admin/:siteid/users/password/:id",
            auth_required: true,
            access_level: pb.SecurityService.ACCESS_EDITOR,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'admin', 'users', 'change_password.js')
        },
        {
            method: 'post',
            path: "/actions/admin/:siteid/users",
            auth_required: true,
            access_level: pb.SecurityService.ACCESS_EDITOR,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'users', 'new_user.js')
        },
        {
            method: 'post',
            path: "/actions/admin/:siteid/users/:id",
            auth_required: true,
            access_level: pb.SecurityService.ACCESS_EDITOR,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'users', 'edit_user.js')
        },
        {
            method: 'delete',
            path: "/actions/admin/:siteid/users/:id",
            auth_required: true,
            access_level: pb.SecurityService.ACCESS_EDITOR,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'users', 'delete_user.js')
        },
        {
            method: 'delete',
            path: "/actions/admin/:siteid/users/unverified/:id",
            auth_required: true,
            access_level: pb.SecurityService.ACCESS_EDITOR,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'users', 'delete_unverified_user.js')
        },
        {
            method: 'get',
            path: "/actions/admin/:siteid/users/verify/:id",
            auth_required: true,
            access_level: pb.SecurityService.ACCESS_EDITOR,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'users', 'verify_user.js')
        },

        {
            method: 'post',
            path: "/actions/admin/:siteid/users/change_password/:id",
            auth_required: true,
            access_level: pb.SecurityService.ACCESS_EDITOR,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'users', 'change_password.js')
        },
        {
            method: 'get',
            path: "/actions/admin/:siteid/users/send_password_reset/:id",
            auth_required: true,
            access_level: pb.SecurityService.ACCESS_MANAGING_EDITOR,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'users', 'send_password_reset.js')
        },
        {
            method: 'post',
            path: "/actions/admin/:siteid/users/send_password_reset/:id",
            auth_required: true,
            access_level: pb.SecurityService.ACCESS_MANAGING_EDITOR,
            controller: path.join(pb.config.docRoot, 'plugins', 'pencilblue', 'controllers', 'actions', 'admin', 'users', 'send_password_reset.js')
        }
    ];
};
