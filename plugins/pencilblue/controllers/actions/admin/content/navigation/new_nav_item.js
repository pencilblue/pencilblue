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
    var BaseController = pb.BaseController;
    var BaseAdminController = pb.BaseAdminController;

    /**
     * Persists a nav item
     * @class PersistNavItemController
     * @constructor
     */
    function PersistNavItemController(){}
    util.inherits(PersistNavItemController, BaseAdminController);

    /**
     * @method init
     * @param {Object} props
     * @param {Function} cb
     */
    PersistNavItemController.prototype.init = function (props, cb) {
        var self = this;
        var init = function () {
            self.sectionService = new pb.SectionService({site: self.site, onlyThisSite: true});
            cb();
        };
        BaseAdminController.prototype.init.call(self, props, init);
    };

    /**
     * Creates a nav item
     * @method post
     * @param {Function} cb
     */
    PersistNavItemController.prototype.post = function(cb) {
        this.render(cb);
    };

    /**
     * Creates a nav item
     * @method render
     * @param {Function} cb
     */
    PersistNavItemController.prototype.render = function(cb){
        var self = this;

        this.getJSONPostParams(function(err, post) {
            if (util.isError(err)) {
                return self.handleError(err, cb);
            }

            var navItem = pb.DocumentCreator.create('section', post, ['keywords'], ['parent']);

            self.persist(navItem, cb);
        });
    };

    /**
     * Edits a nav item
     * @method render
     * @param {Function} cb
     */
    PersistNavItemController.prototype.put = function(cb) {
        var self = this;
        var vars = this.pathVars;

        var message = this.hasRequiredParams(vars, ['id']);
        if (message) {
            return cb({
                code: 400,
                content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, message)
            });
        }

        this.getJSONPostParams(function(err, post) {
            if (util.isError(err)) {
                return self.handleError(err, cb);
            }

            //load object
            self.siteQueryService.loadById(vars.id, 'section', function(err, navItem) {
                if(util.isError(err)) {
                    return self.handleError(err, cb);
                }
                else if (!util.isObject(navItem)){
                    return cb({
                        code: 404,
                        content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('INVALID_UID'))
                    });
                }

                pb.DocumentCreator.update(post, navItem, ['keywords'], ['url', 'parent']);
                self.persist(navItem, cb);
            });
        });
    };

    /**
     * Handles the formatting and persists a nav item
     * @method render
     * @param {Function} cb
     */
    PersistNavItemController.prototype.persist = function(navItem, cb) {
        var self = this;

        //ensure a URL was provided
        if(!navItem.url && navItem.name) {
            navItem.url = navItem.name.toLowerCase().split(' ').join('-');
        }

        //strip unneeded properties
        pb.SectionService.trimForType(navItem);

        //validate & persist
        var isUpdate = !!navItem[pb.DAO.getIdField()];
        this.sectionService.save(navItem, function(err, result) {
            if(util.isError(err)) {
                return self.handleError(err, cb);
            }
            else if(util.isArray(result) && result.length > 0) {
                return self.handleBadRequest(result, cb);
            }

            //update cached nav map
            self.checkForNavMapUpdate(navItem, function() {
                var msg = navItem.name + ' ' + self.ls.g(isUpdate ? 'admin.EDITED' : 'admin.CREATED');
                cb({
                    content: BaseController.apiResponse(pb.BaseController.API_SUCCESS, msg, true)
                });
            });
        });
    };

    /**
     * Forces the nav map to update
     * @method checkForNavMapUpdate
     * @param {Function} cb
     */
    PersistNavItemController.prototype.checkForNavMapUpdate = function(navItem, cb) {
        this.sectionService.updateNavMap(navItem, cb);
    };

    /**
     * @method handleError
     * @param {Error} err
     * @param {Function} cb
     */
    PersistNavItemController.prototype.handleError = function(err, cb) {
        return cb({
            code: 500,
            content: BaseController.apiResponse(BaseController.API_ERROR, this.ls.get('ERROR_SAVING'))
        });
    };

    /**
     * @method handleBadRequest
     * @param {Array} validationErrors
     * @param {Function} cb
     */
    PersistNavItemController.prototype.handleBadRequest = function(validationErrors, cb) {
        return cb({
            code: 400,
            content: BaseController.apiResponse(BaseController.API_ERROR, PersistNavItemController.getHtmlErrorMsg(validationErrors))
        });
    };

    /**
     * Formats the errors as a single HTML message
     * @static
     * @method checkForNavMapUpdate
     * @param {Function} cb
     */
    PersistNavItemController.getHtmlErrorMsg = function(validationErrors) {
        return validationErrors.reduce(function(html, error, i) {
            if (i > 0) {
                html += '<br/>';
            }
            return html + error.field + ': ' + error.message;
        }, '');
    };

    //exports
    return PersistNavItemController;
};
