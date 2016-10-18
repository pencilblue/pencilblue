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
var async = require('async');

module.exports = function(pb) {

    //pb dependencies
    var util = pb.util;
    var MediaServiceV2 = pb.MediaServiceV2;

    /**
     * Interface for adding and editing media
     * @class MediaForm
     * @constructor
     */
    function MediaForm(){}
    util.inherits(MediaForm, pb.BaseAdminController);

    //statics
    var SUB_NAV_KEY = 'media_form';

    MediaForm.prototype.initSync = function(/*context*/) {

        this.service = new MediaServiceV2(this.getServiceContext());
    };

    /**
    * @method render
    * @param {Function} cb
    */
    MediaForm.prototype.render = function(cb) {
        var self = this;
        var vars = this.pathVars;

        this.gatherData(vars, function(err, data) {
            if (util.isError(err)) {
                throw err;
            }
            else if(!data.media) {
                self.reqHandler.serve404();
                return;
            }

            self.media = data.media;
            data.media.media_topics = self.getMediaTopics(data);
            self.getAngularObjects(data, function(angularObjects) {
                self.setPageName(self.media[pb.DAO.getIdField()] ? self.media.name : self.ls.g('media.NEW_MEDIA'));
                self.ts.registerLocal('acceptable_extensions', function(flag, cb) {
                    //get acceptable file extensions
                    var extensions = pb.MediaServiceV2.getSupportedExtensions();
                    for (var i = 0; i < extensions.length; i++) {
                        if (extensions[i].charAt(0) !== '.') {
                            extensions[i] = '.' + extensions[i];
                        }
                    }

                    cb(null, new pb.TemplateValue(extensions.join(','), false));
                });
                self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
                self.ts.load('admin/content/media/media_form', function(err, result) {
                    cb({content: result});
                });
            });
        });
    };

    MediaForm.prototype.getAngularObjects = function(data, cb) {
        var self = this;
        pb.AdminSubnavService.getWithSite(SUB_NAV_KEY, self.ls, data.media, {site: data.media.site}, function(err, pills) {
            data.pills = [];
            //Log error. Don't return
            if (util.isError(err)){
                pb.log.error("MediaForm: AdminSubnavService.getWithSite callback error. ERROR[%s]", err.stack);
            }
            //Only populate pills if we didn't fail
            else{
                data.pills = pills;
            }

            //TODO: err first arg for style. User experience error when no pills?
            cb(pb.ClientJs.getAngularObjects(data));
        });
    };

    MediaForm.prototype.gatherData = function(vars, cb) {
        var self = this;

        var media = null;
        var tasks = {
            tabs: function(callback) {
                var tabs   =
                [{
                    active: 'active',
                    href: '#media_upload',
                    icon: 'film',
                    title: self.ls.g('media.LINK_OR_UPLOAD')
                },
                {
                    href: '#topics_dnd',
                    icon: 'tags',
                    title: self.ls.g('admin.TOPICS')
                }];
                callback(null, tabs);
            },

            navigation: function(callback) {
                callback(null, pb.AdminNavigation.get(self.session, ['content', 'media'], self.ls, self.site));
            },

            media: function(callback) {
                if(!vars.id) {
                    return callback(null, {
                        media_topics: [],
                        site: self.site
                    });
                }
                self.service.get(vars.id, function(err, mediaEntity) {
                    media = mediaEntity;
                    callback(err, mediaEntity);
                });
            },

            topics: function(callback) {
                if (!media) {
                    return callback(null, []);
                }
                var opts = {
                    select: pb.DAO.PROJECT_ALL,
                    where: pb.DAO.ANYWHERE,
                    order: {name: pb.DAO.ASC}
                };
                self.siteQueryService.q('topic', opts, callback);
            }
        };
        async.series(tasks, cb);
    };

    MediaForm.prototype.getMediaTopics = function(data) {
        var topics = [];
        if(!data.media.media_topics) {
            return topics;
        }

        for(var i = 0; i < data.media.media_topics.length; i++) {
            for(var j = 0; j < data.topics.length; j++) {
                if(pb.DAO.areIdsEqual(data.topics[j][pb.DAO.getIdField()], data.media.media_topics[i])) {
                    topics.push(data.topics[j]);
                    data.topics.splice(j, 1);
                    break;
                }
            }
        }

        return topics;
    };

    MediaForm.getSubNavItems = function(key, ls, data) {
        return [{
            name: 'manage_media',
            title: data[pb.DAO.getIdField()] ? ls.g('generic.EDIT') + ' ' + data.name : ls.g('media.NEW_MEDIA'),
            icon: 'chevron-left',
            href: '/admin/content/media'
        }, {
            name: 'new_media',
            title: '',
            icon: 'plus',
            href: '/admin/content/media/new'
        }];
    };

    //register admin sub-nav
    pb.AdminSubnavService.registerFor(SUB_NAV_KEY, MediaForm.getSubNavItems);

    //exports
    return MediaForm;
};
