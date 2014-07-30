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
 * Creates a new topic
 */

function NewTopic(){}

//inheritance
util.inherits(NewTopic, pb.FormController);

NewTopic.prototype.onPostParamsRetrieved = function(post, cb) {
	var self    = this;
    var get     = this.query;
	var message = this.hasRequiredParams(post, ['name']);
	if(message) {
        this.formError(message, '/admin/content/topics/new_topic', cb);
        return;
    }

    var dao = new pb.DAO();
    dao.count('topic', {name: post.name}, function(err, count) {
        if(count > 0) {
            if(get.manage) {
                self.formError(self.ls.get('EXISTING_TOPIC'), '/admin/content/topics/manage_topics', cb);
                return;
            }
            self.formError(self.ls.get('EXISTING_TOPIC'), '/admin/content/topics/new_topic', cb);
            return;
        }

        var topicDocument = pb.DocumentCreator.create('topic', post);
        dao.update(topicDocument).then(function(result) {
            if(util.isError(result)) {
                if(get.manage) {
                    self.formError(self.ls.get('ERROR_SAVING'), '/admin/content/topics/manage_topics', cb);
                    return;
                }
                self.formError(self.ls.get('ERROR_SAVING'), '/admin/content/topics/new_topic', cb);
                return;
            }

            self.session.success = topicDocument.name + ' ' + self.ls.get('CREATED');
            if(get.manage) {
                self.redirect('/admin/content/topics/manage_topics', cb);
                return;
            }
            self.redirect('/admin/content/topics/new_topic', cb);
        });
    });
};

//exports
module.exports = NewTopic;
