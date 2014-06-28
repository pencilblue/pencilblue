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

/**
 * Imports a CSV of topics
 */

function ImportTopics(){}

//inheritance
util.inherits(ImportTopics, pb.BaseController);

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

            var topics = data.toString().split(',');
            self.saveTopics(topics, cb);
        });
    });
};

ImportTopics.prototype.saveTopics = function(topics, cb) {
    var content = {completed: false};

    //create tasks
    var dao = new pb.DAO();
    var tasks = pb.utils.getTasks(topics, function(topicArry, index) {
    	return function(callback) {

    		dao.count('topic', {name: topicArry[index].trim()}, function(err, count){
    			if (count > 0) {
    				callback(null, true);
    				return;
    			}

    			var topicDocument = pb.DocumentCreator.create('topic', {name: topicArry[index].trim()});
    			dao.update(topicDocument).then(function(result){
    				if (util.isError(result)) {
    					callback(result, null);
    					return;
    				}
    				callback(null, result);
    			});
    		});

    	};
    });

    //execute in parallel
    async.parallelLimit(tasks, 3, function(err, results){
    	content.completed = !util.isError(err);
    	cb({content: JSON.stringify(content), content_type: 'application/json'});
    });
};

//exports
module.exports = ImportTopics;
