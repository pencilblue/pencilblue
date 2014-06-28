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
 * Interface for managing comments
 */

function ManageComments() {}

//dependencies
var Comments = require('../comments');

//inheritance
util.inherits(ManageComments, pb.BaseController);

var SUB_NAV_KEY = 'manage_comments';

ManageComments.prototype.render = function(cb) {
    var self = this;
    var dao  = new pb.DAO();
    dao.query('comment', pb.DAO.ANYWHERE, pb.DAO.PROJECT_ALL, {created: -1}, 500).then(function(comments) {
        if (util.isError(comments)) {
            //TODO handle this
        }

        pb.settings.get('content_settings', function(err, contentSettings) {
            self.getCommentDetails(comments, dao, function(commentsWithDetails) {
                self.setPageName(self.ls.get('MANAGE_COMMENTS'));
                self.ts.load('admin/content/comments/manage_comments', function(err, data) {
                    var result = ''+data;

                    var pills = pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, SUB_NAV_KEY);
                    result    = result.split('^angular_script^').join(pb.js.getAngularController(
                    {
                        navigation: pb.AdminNavigation.get(self.session, ['content', 'comments'], self.ls),
                        pills: pills,
                        comments: commentsWithDetails,
                        allowComments: contentSettings.allow_comments
                    }, [], 'initCommentsPagination()'));

                    cb({content: result});
                });
            });
        });
    });
};

ManageComments.prototype.getCommentDetails = function(comments, dao, cb) {
    var self = this;

    if(comments.length === 0) {
        cb(comments);
        return;
    }

    this.getCommentingUser = function(index) {
        dao.loadById(comments[index].commenter, 'user', function(err, user) {
            if(!util.isError(err) && user !== null) {
                comments[index].user_name = user.first_name + ' ' + user.last_name;
            }

            dao.loadById(comments[index].article, 'article', function(err, article) {
                if(!util.isError(err) && article !== null) {
                    comments[index].article_url = article.url;
                    comments[index].article_headline = article.headline;
                }

                index++;
                if(index >= comments.length) {
                    cb(comments);
                    return;
                }

                self.getCommentingUser(index);
            });
        });
    };

    this.getCommentingUser(0);
};

ManageComments.getSubNavItems = function(key, ls, data) {
    var pills = Comments.getPillNavOptions();
    pills.unshift(
    {
        name: SUB_NAV_KEY,
        title: ls.get('MANAGE_COMMENTS'),
        icon: 'refresh',
        href: '/admin/content/comments/manage_comments'
    });
    return pills;
};

//register admin sub-nav
pb.AdminSubnavService.registerFor(SUB_NAV_KEY, ManageComments.getSubNavItems);

//exports
module.exports = ManageComments;
