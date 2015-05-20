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

module.exports = function(pb) {
    
    //pb dependencies
    var util = pb.util;
    
    /**
     * Edits a nav item
     */
    function EditNavItem(){}
    util.inherits(EditNavItem, pb.BaseAdminController);

    EditNavItem.prototype.render = function(cb){
        var self = this;
        var vars = this.pathVars;

        var message = this.hasRequiredParams(vars, ['id']);
        if (message) {
            cb({
                code: 400,
                content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, message)
            });
            return;
        }

        this.getJSONPostParams(function(err, post) {
            //load object
            self.siteQueryService.loadById(vars.id, 'section', function(err, navItem) {
                if(util.isError(err) || !util.isObject(navItem)) {
                    cb({
                        code: 400,
                        content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('INVALID_UID'))
                    });
                    return;
                }

                self.wasContainer = navItem.type === 'container';
                pb.DocumentCreator.update(post, navItem, ['keywords'], ['url', 'parent']);

                //ensure a URL was provided
                if(!navItem.url && navItem.name) {
                    navItem.url = navItem.name.toLowerCase().split(' ').join('-');
                }

                //strip unneeded properties
                pb.SectionService.trimForType(navItem);

                //validate
                self.sectionService.save(navItem, function(err, result) {
                    if(util.isError(err)) {
                        cb({
                            code: 500,
                            content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_SAVING'))
                        });
                        return;
                    }
                    else if(util.isArray(result) && result.length > 0) {
                        cb({
                            code: 500,
                            content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, EditNavItem.getHtmlErrorMsg(result))
                        });
                        return;
                    }

                    self.checkForNavMapUpdate(navItem, function() {
                        cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, navItem.name + ' ' + self.ls.get('EDITED'))});
                    });
                });
            });
        });
    };

    EditNavItem.prototype.deleteOrphans = function(navItem, cb) {
        this.sectionService.deleteChildren(navItem[pb.DAO.getIdField()], cb);
    };

    EditNavItem.prototype.checkForNavMapUpdate = function(navItem, cb) {
        this.sectionService.updateNavMap(navItem, cb);
    };

    EditNavItem.getHtmlErrorMsg = function(validationErrors) {
        var html = '';
        for (var i = 0; i < validationErrors.length; i++) {
            if (i > 0) {
                html += '<br/>';
            }
            html += validationErrors[i].field + ':' + validationErrors[i].message;
        }
        return html;
    };

    //exports
    return EditNavItem;
};
