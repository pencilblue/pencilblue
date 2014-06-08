/**
 * Manage Comments - Interface for managing the site's comments
 *
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
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
