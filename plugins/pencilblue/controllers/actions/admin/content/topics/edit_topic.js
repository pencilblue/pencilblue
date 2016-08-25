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

module.exports = function(pb) {

    //pb dependencies
    var util = pb.util;

    /**
     * Creates a new topic
     */
    function NewTopic(){}
    util.inherits(NewTopic, pb.BaseAdminController);

    NewTopic.prototype.render = function(cb) {
        var self = this;
        var vars = this.pathVars;

        var message = this.hasRequiredParams(vars, ['id']);
        if (message) {
            cb({
                code: 400,
                content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, message)
            });
            return;
        }

        this.getJSONPostParams(function(err, post) {
            message = self.hasRequiredParams(post, ['name']);
            if(message) {
                cb({
                    code: 400,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, message)
                });
                return;
            }

            self.siteQueryService.loadById(vars.id, 'topic', function(err, topic) {
                if(util.isError(err) || !util.isObject(topic)) {
                    cb({
                        code: 400,
                        content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.g('generic.INVALID_UID'))
                    });
                    return;
                }

                pb.DocumentCreator.update(post, topic);

                self.siteQueryService.loadByValue('name', topic.name, 'topic', function(err, testTopic) {
                    if(testTopic && !testTopic[pb.DAO.getIdField()].equals(topic[pb.DAO.getIdField()])) {
                        cb({
                            code: 400,
                            content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.g('topics.EXISTING_TOPIC'))
                        });
                        return;
                    }

                    self.siteQueryService.save(topic, function(err, result) {
                        if(util.isError(err)) {
                            return cb({
                                code: 500,
                                content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.g('generic.ERROR_SAVING'))
                            });
                        }

                        cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, topic.name + ' ' + self.ls.g('admin.EDITED'))});
                    });
                });
            });
        });
    };

    //exports
    return NewTopic;
};
