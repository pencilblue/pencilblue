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
     * Interface for managing comments
     * @class ManageComments
     * @constructor
     */
    function ManageComments() {}
    util.inherits(ManageComments, pb.BaseAdminController);

    /**
     *
     * @private
     * @static
     * @property SUB_NAV_KEY
     * @type {String}
     */
    var SUB_NAV_KEY = 'manage_comments';

    /**
     * @see BaseController.render
     * @method render
     * @param {Function} cb
     */
    ManageComments.prototype.render = function(cb) {
        var self = this;

        //query for comments (limited to 500)
        var opts = {
            select: pb.DAO.PROJECT_ALL,
            where: pb.DAO.ANYWHERE,
            order: {created: -1},
            limit: 500
        };
        self.siteQueryService.q('comment', opts, function(err, comments) {
            if (util.isError(err)) {
                return self.reqHandler.serveError(err);
            }

            //retrieve the content settings or defaults if they have not yet been configured
            var contentService = new pb.ContentService({site: self.site});
            contentService.getSettings(function(err, contentSettings) {
                // Handle error
                if (util.isError(err)){
                    pb.log.error("ContentService.getSettings encountered an error. ERROR[%s]", err.stack);
                    return;
                }

                //retrieve any details
                self.getCommentDetails(comments, function(commentsWithDetails) {
                    var pills = self.getAdminPills(SUB_NAV_KEY, self.ls, SUB_NAV_KEY);
                    var angularObjects = pb.ClientJs.getAngularObjects({
                        navigation: pb.AdminNavigation.get(self.session, ['content', 'comments'], self.ls, self.site),
                        pills: pills,
                        comments: commentsWithDetails,
                        allowComments: contentSettings.allow_comments,
                        siteRoot: self.siteRoot
                    });

                    //load the template
                    self.setPageName(self.ls.g('comments.MANAGE_COMMENTS'));
                    self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
                    self.ts.load('admin/content/comments/manage_comments', function(err, result) {
                        cb({content: result});
                    });
                });
            });
        });
    };

    /**
     *
     * @method getCommentDetails
     * @param {Array} comments
     * @param {Function} cb
     */
    ManageComments.prototype.getCommentDetails = function(comments, cb) {
        var self = this;

        if(comments.length === 0) {
            return cb(comments);
        }

        this.getCommentingUser = function(index) {
            self.dao = new pb.DAO();
            self.dao.__proto__.loadById(comments[index].commenter, 'user', function(err, user) {
                if(!util.isError(err) && user !== null) {
                    comments[index].user_name = user.first_name + ' ' + user.last_name;
                }

                self.dao.loadById(comments[index].article, 'article', function(err, article) {
                    if(!util.isError(err) && article !== null) {
                        comments[index].article_url = article.url;
                        comments[index].article_headline = article.headline;
                    }

                    index++;
                    if(index >= comments.length) {
                        return cb(comments);
                    }

                    self.getCommentingUser(index);
                });
            });
        };

        this.getCommentingUser(0);
    };

    /**
     *
     * @static
     * @method getSubNavItems
     * @param {String} key
     * @param {Localization} ls
     * @param {*} data
     */
    ManageComments.getSubNavItems = function(key, ls, data) {
        return [{
            name: SUB_NAV_KEY,
            title: ls.g('comments.MANAGE_COMMENTS'),
            icon: 'refresh',
            href: '/admin/content/comments'
        }];
    };

    //register admin sub-nav
    pb.AdminSubnavService.registerFor(SUB_NAV_KEY, ManageComments.getSubNavItems);

    //exports
    return ManageComments;
};
