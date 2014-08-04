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
 * Deletes a user
 */

function DeleteUser(){}

//inheritance
util.inherits(DeleteUser, pb.BaseController);

DeleteUser.prototype.render = function(cb) {
    var self    = this;
    var vars    = this.pathVars;

    var message = this.hasRequiredParams(vars, ['id']);
    if (message) {
        this.formError(message, '/admin/users/manage_users', cb);
        return;
    }

    if(vars.id === self.session.authentication.user_id) {
        self.formError(self.ls.get('USER_DELETE_SELF'), '/admin/users/manage_users', cb);
        return;
    }

    //ensure existence
    var dao = new pb.DAO();
    dao.loadById(vars.id, 'user', function(err, user) {
        if(user === null) {
            self.formError(self.ls.get('ERROR_SAVING'), '/admin/users/manage_users', cb);
            return;
        }

        // delete the user's comments
        dao.deleteMatching({commenter: vars.id}, 'comment').then(function(result) {
            //reassign the user's content to the current user
            self.reassignContent(vars.id, self.session.authentication.user_id, dao, function(articles, pages, sections) {
                //delete the user
                dao.deleteMatching({_id: ObjectID(vars.id)}, 'user').then(function(result) {
                    if(result < 1) {
                        self.formError(self.ls.get('ERROR_SAVING'), '/admin/users/manage_users', cb);
                        return;
                    }

                    self.session.success = user.username + ' ' + self.ls.get('DELETED');
                    self.redirect('/admin/users/manage_users', cb);
                });
            });
        });
    });
};

DeleteUser.prototype.reassignContent = function(deletedUserId, newUserId, dao, cb) {
    dao.query('article', {author: deletedUserId}).then(function(articles) {
        dao.query('page', {author: deletedUserId}).then(function(pages) {
            dao.query('section', {editor: deletedUserId}).then(function(sections) {
                var self = this;

                this.updateArticlesUser = function(index) {
                    if(index >= articles.length) {
                        self.updatePagesUser(0);
                        return;
                    }

                    dao.update(articles[index]).then(function(result) {
                        index++;
                        self.updateArticlesUser(index);
                    });
                };

                this.updatePagesUser = function(index) {
                    if(index >= pages.length) {
                        self.updateSectionsUser(0);
                        return;
                    }

                    dao.update(pages[index]).then(function(result) {
                        index++;
                        self.updatePagesUser(index);
                    });
                };

                this.updateSectionsUser = function(index) {
                    if(index >= sections.length) {
                        cb(articles, pages, sections);
                        return;
                    }

                    dao.update(sections[index]).then(function(result) {
                        index++;
                        self.updateSectionsUser(index);
                    });
                };

                console.log(articles);
                articles = articles || [];
                pages = pages || [];
                sections = sections || [];

                for(var i = 0; i < articles.length; i++) {
                    articles[i].author = newUserId;
                }
                for(i = 0; i < pages.length; i++) {
                    pages[i].author = newUserId;
                }
                for(i = 0; i < sections.length; i++) {
                    sections[i].editor = newUserId;
                }

                this.updateArticlesUser(0);
            });
        });
    });
};

//exports
module.exports = DeleteUser;
