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

module.exports = function BookApiControllerModule(pb) {

    //PB dependencies
    var util              = pb.util;
    var BaseApiController = pb.BaseApiController;
    var PluginService     = pb.PluginService;

    /**
     * BookApiController - A sample controller to demonstrate how to build an API
     * 
     * @author Brian Hyder <brian@pencilblue.org>
     * @copyright 2014 PencilBlue, LLC.  All Rights Reserved
     * @return
     */
    function BookApiController(){}
    util.inherits(BookApiController, BaseApiController);


    /**
     * Calls init of BaseController and sets BookService based on the current site
     *
     * @param props
     * @param cb
     */
    BookApiController.prototype.init = function(props, cb) {
        var self = this;
        pb.BaseController.prototype.init.call(self, props, function () {
            var BookService = PluginService.getService('BookService', 'sample', self.site);
            /**
             * An instance of BookService that the underlying BaseApiController can
             * leverage
             * @property service
             * @type {BookService}
             */
            self.service = new BookService(self.getServiceContext());
            cb();
        });

    };




    /**
     * Provides the routes that are to be handled by an instance of this prototype.  
     * The route provides a definition of path, permissions, authentication, and 
     * expected content type. In this particular case we are building a simple 
     * API with no special CRUD operations.  Therefore, we can leverage the 
     * power of the BaseApiController and let it do the heavy lifting for us.  
     * All we have to do is define the routes.
     * Method is optional
     * Path is required
     * Permissions are optional
     * Access levels are optional
     * Content type is optional
     * 
     * @param cb A callback of the form: cb(error, array of objects)
     */
    BookApiController.getRoutes = function(cb) {
        var routes = [
            {
                method: 'get',
                path: "/api/sample/books",
                handler: "getAll",
                content_type: 'application/json'
            },
            {
                method: 'get',
                path: "/api/sample/books/:id",
                handler: "get",
                content_type: 'application/json'
            },
            {
                method: 'put',
                path: "/api/sample/books/:id",
                handler: "put",
                content_type: 'application/json',
                request_body: ['application/json', 'application/x-www-form-urlencoded', 'multipart/form-data']
            },
            {
                method: 'post',
                path: "/api/sample/books",
                handler: "post",
                content_type: 'application/json',
                request_body: ['application/json', 'application/x-www-form-urlencoded', 'multipart/form-data']
            },
            {
                method: 'delete',
                path: "/api/sample/books/:id",
                handler: "delete",
                content_type: 'application/json'
            }
        ];
        cb(null, routes);
    };

    //exports
    return BookApiController;
};