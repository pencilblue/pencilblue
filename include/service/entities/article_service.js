/*
 Copyright (C) 2016  PencilBlue, LLC

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
'use strict';

//dependencies
const _ = require('lodash');
const async = require('async');
const DAO = require('../../dao/dao');
const log = require('../../utils/logging').newInstance('MediaLoader');
const MediaServiceV2 = require('./content/media_service_v2');
const TemplateService = require('./template_service').TemplateService;

/**
 * TODO [1.0] move to its own file
 * Handles retrieval and injection of media in articles and pages
 * TODO [1.0] change contructor to take a media service instance
 * @module Services
 * @class MediaLoader
 * @params {object} opts
 */
class MediaLoader {
    constructor(opts) {
        /**
         * @property mediaService
         * @type {MediaService}
         */
        this.service = new MediaServiceV2(opts);
    }

    /**
     * Processes an article or page to insert media
     * @method start
     * @param  {String} articleLayout The HTML layout of the article or page
     * @param {object} [options]
     * @param  {Function} cb
     */
    start(articleLayout, options, cb) {
        if (_.isFunction(options)) {
            cb = options;
            options = {};
        }
        if (!_.isObject(options.media)) {
            options.media = {};
        }

        //scan for media that should be retrieved
        var flags = this.scanForFlags(articleLayout);
        if (flags.length === 0) {
            return cb(null, articleLayout);
        }

        //reconcile what media is already cached and that which should be loaded
        var idsToRetrieve = [];
        flags.forEach(function (flag) {
            if (!options.media[flag.id]) {
                idsToRetrieve.push(flag.id);
            }
        });

        //when all media is already cached just do the processing
        if (idsToRetrieve.length === 0) {
            return this.onMediaAvailable(articleLayout, options, cb);
        }

        //retrieve the media that we need
        var self = this;
        var opts = {
            where: idsToRetrieve.length === 1 ? DAO.getIdWhere(idsToRetrieve[0]) : DAO.getIdInWhere(idsToRetrieve)
        };
        this.service.getAll(opts, function (err, media) {
            if (_.isError(err)) {
                return cb(err);
            }

            //cache the retrieved media
            var idField = DAO.getIdField();
            media.forEach(function (mediaItem) {
                options.media[mediaItem[idField].toString()] = mediaItem;
            });

            self.onMediaAvailable(articleLayout, options, cb);
        });
    }

    /**
     * @method onMediaAvailable
     * @param {String} articleLayout
     * @param {Object} options
     * @param {Function} cb
     */
    onMediaAvailable(articleLayout, options, cb) {
        var self = this;

        this.getMediaTemplate(options, function (err, mediaTemplate) {
            options.mediaTemplate = mediaTemplate;

            async.whilst(
                function () {
                    return articleLayout.indexOf('^media_display_') >= 0;
                },
                function (callback) {
                    self.replaceMediaTag(articleLayout, mediaTemplate, options.media, function (err, newArticleLayout) {
                        articleLayout = newArticleLayout;
                        callback();
                    });
                },
                function (err) {
                    cb(err, articleLayout);
                }
            );
        });
    }

    /**
     * Retrieves the media template for rendering media
     * @method getMediaTemplate
     * @param {Object} options
     * @param {string} [options.mediaTemplatePath='elements/media']
     * @param {Function} cb
     */
    getMediaTemplate(options, cb) {
        if (options.mediaTemplate) {
            return cb(null, options.mediaTemplate);
        }

        var ts = new TemplateService(options);
        ts.load(options.mediaTemplatePath || 'elements/media', cb);
    }

    /**
     * Scans a string for media flags then parses them to return an array of
     * each one that was found
     * @method scanForFlags
     * @param {String} layout
     * @return {Array}
     */
    scanForFlags(layout) {
        if (!_.isString(layout)) {
            return [];
        }

        var index;
        var flags = [];
        while ((index = layout.indexOf('^media_display_')) >= 0) {
            flags.push(MediaServiceV2.extractNextMediaFlag(layout));

            var nexPosition = layout.indexOf('^', index + 1);
            layout = layout.substr(nexPosition);
        }
        return flags;
    }

    /**
     * Replaces an article or page layout's ^media_display^ tag with a media embed
     * @method replaceMediaTag
     * @param {String}   layout        The HTML layout of the article or page
     * @param {String}   mediaTemplate The template of the media embed
     * @param {object} mediaCache
     * @param {Function} cb            Callback function
     */
    replaceMediaTag(layout, mediaTemplate, mediaCache, cb) {
        var flag = MediaServiceV2.extractNextMediaFlag(layout);
        if (!flag) {
            return cb(null, layout);
        }

        var data = mediaCache[flag.id];
        if (!data) {
            log.warn("MediaLoader: Content contains reference to missing media [%s].", flag.id);
            return cb(null, layout.replace(flag.flag, ''));
        }

        //ensure the max height is set if explicity set for media replacement
        var options = {
            view: 'post',
            style: {},
            attrs: {
                frameborder: "0",
                allowfullscreen: ""
            }
        };
        if (flag.style.maxHeight) {
            options.style['max-height'] = flag.style.maxHeight;
        }
        this.service.render(data, options, function (err, html) {
            if (_.isError(err)) {
                return cb(err);
            }

            //get the style for the container
            var containerStyleStr = MediaServiceV2.getStyleForPosition(flag.style.position) || '';

            //finish up replacements
            var mediaEmbed = mediaTemplate.split('^media^').join(html);
            mediaEmbed = mediaEmbed.split('^caption^').join(data.caption);
            mediaEmbed = mediaEmbed.split('^display_caption^').join(data.caption ? '' : 'display: none');
            mediaEmbed = mediaEmbed.split('^container_style^').join(containerStyleStr);
            cb(null, layout.replace(flag.flag, mediaEmbed));
        });
    }
}

//exports
module.exports = {
    MediaLoader: MediaLoader
};
