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

    //PB dependencies
    var util            = pb.util;
    var TopicService    = pb.TopicService;
    var SecurityService = pb.SecurityService

    /**
     * 
     * @class TopicApiController
     * @constructor
     */
    function TopicApiController(){
    
        /**
         * 
         * @property topicService
         * @type {TopicService}
         */
        this.service = new TopicService();
    }
    util.inherits(TopicApiController, pb.BaseController);

    TopicApiController.prototype.get = function(cb) {
        var id = this.pathVars.id;
        this.service.get(id, this.handleGet(cb));
    };
                         
    TopicApiController.prototype.handleGet = function(cb) {
        var self = this;
        return function(err, obj) {
            if (util.isError(err)) {
                return cb(err);
            }
            else if (util.isNullOrUndefined(obj)) {
                return self.reqHandler.serve404();    
            }
            
            cb({
                content: JSON.stringify(obj)
            });
        };
    };
    
    TopicApiController.prototype.post = function(cb) {
        var dto = this.body || {};
        delete dto[pb.DAO.getIdField()];
        this.service.save(dto, this.handleSave(cb));
    };
    
    TopicApiController.prototype.put = function(cb) {
        var dto = this.body || {};
        this.service.save(dto, this.handleSave(cb));
    };
    
    TopicApiController.prototype.handleSave = function(cb) {
        return this.handleGet(cb);
    };

    TopicApiController.prototype.delete = function(cb) {
        var id = this.pathVars.id;
        this.service.deleteById(id, this.handleDelete(cb));
    };
    
    TopicApiController.prototype.handleDelete = function(cb) {
        var self = this;
        return function(err, obj) {
            if (util.isError(err)) {
                return cb(err);
            }
            else if (util.isNullOrUndefined(obj)) {
                return self.reqHandler.serve404();    
            }
            
            cb({
                content: '',
                code: 204
            });
        };
    };

    //exports
    return TopicApiController;
};