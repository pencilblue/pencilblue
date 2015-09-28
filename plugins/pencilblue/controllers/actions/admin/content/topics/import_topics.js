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
var fs         = require('fs');
var formidable = require('formidable');
var async      = require('async');

module.exports = function(pb) {

    //pb dependencies
    var util = pb.util;

    /**
     * Imports a CSV of topics
     * @class ImportTopics
     * @constructor
     */
    function ImportTopics(){}
    util.inherits(ImportTopics, pb.BaseAdminController);

    ImportTopics.prototype.render = function(cb) {
        var self  = this;
        var files = [];

        var form = new formidable.IncomingForm();
        form.on('file', function(field, file)
        {
            files.push(file);
        });
        form.parse(this.req, function() {
            //TODO handle error, max size, etc.

            fs.readFile(files[0].path, function(err, data) {
                if(util.isError(err)) {
                    self.formError(self.ls.get('ERROR_SAVING'), '/admin/content/topics/import_topics', cb);
                    return;
                }

                var topics = data.toString().trim().split(',');
                if(topics.length <= 1) {
                    cb({
                        code: 400,
                        content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.g('generic.INVALID_FILE'))
                    });
                }

                self.saveTopics(topics, cb);
            });
        });
    };

    ImportTopics.prototype.saveTopics = function(topics, cb) {
        var self = this;
        //create tasks
        var tasks = util.getTasks(topics, function(topicArry, index) {
            return function(callback) {

                self.siteQueryService.count('topic', {name: topicArry[index].trim()}, function(err, count){
                    if (count > 0) {
                        return callback(null, true);
                    }

                    var topicDocument = pb.DocumentCreator.create('topic', {name: topicArry[index].trim()});
                    self.siteQueryService.save(topicDocument, callback);
                });

            };
        });

        //execute in parallel
        async.parallelLimit(tasks, 3, function(err, results){
            if(util.isError(err)) {
                return cb({
                    code: 500,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.g('generic.ERROR_SAVING'))
                });
            }

            cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, self.ls.g('topics.TOPICS_CREATED'))});
        });
    };

    //exports
    return ImportTopics;
};
