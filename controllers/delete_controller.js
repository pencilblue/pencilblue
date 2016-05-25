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

//dependencies
var async = require('async');
var util  = require('../include/util.js');

module.exports = function(pb) {

    /**
     * Deletes objects from the database
     * @class DeleteController
     * @constructor
     * @extends FormController
     */
    function DeleteController(){}
    util.inherits(DeleteController, pb.FormController);

    /**
     *
     * @method onPostParamsRetrieved
     * @param {Function} cb
     */
    DeleteController.prototype.onPostParamsRetrieved = function(post, cb) {
        var self = this;
        var get  = this.query;

        //merge get and post in case ID was a query string param
        util.merge(get, post);

        //check for the required parameters
        var message = this.hasRequiredParams(post, this.getRequiredFields());
        if(message) {
            this.formError(message, this.getFormErrorRedirect(null, message), cb);
            return;
        }

        //create the tasks & execute in order
        var tasks = [
             function(callback){
                 self.canDelete(function(err, canDelete){

                     var error = null;
                     if (util.isError(err)) {
                         error = err;
                     }
                     else if (!canDelete) {
                         error = canDelete;
                     }
                     callback(error, canDelete);
                 });
             },
             function(callback){
                 self.onBeforeDelete(callback);
             },
             function(callback){
                 var dao = new pb.DAO();
                 dao.delete(self.getDeleteQuery(), self.getDeleteCollection(), callback);
             },
             function(callback){
                 self.onAfterDelete(callback);
             },
        ];
        async.series(tasks, function(err, results){

            //process the results
            if (err) {
                self.onError(err, null, cb);
            }
            else {
                cb(self.getDataOnSuccess(results));
            }
        });
    };

    /**
     *
     * @method getRequiredFields
     * @param {Function} cb
     */
    DeleteController.prototype.getRequiredFields = function () {
        return ['id'];
    };

    /**
     *
     * @method canDelete
     * @param {Function} cb
     */
    DeleteController.prototype.canDelete = function(cb) {
        cb(null, true);
    };

    /**
     *
     * @method onBeforeDelete
     * @param {Function} cb
     */
    DeleteController.prototype.onBeforeDelete = function(cb) {
        cb(null, true);
    };

    /**
     *
     * @method onAfterDelete
     * @param {Function} cb
     */
    DeleteController.prototype.onAfterDelete = function(cb) {
        cb(null, true);
    };

    /**
     *
     * @method getDeleteQuery
     * @return {Object}
     */
    DeleteController.prototype.getDeleteQuery = function() {
        return pb.DAO.getIdWhere(this.query.id);
    };

    /**
     *
     * @method
     * @param {Error} [err]
     * @param {String} message
     * @param {Function} cb
     */
    DeleteController.prototype.onError = function(err, message, cb) {
        if (util.isNullOrUndefined(message)) {
            message = this.getDefaultErrorMessage();
        }
        this.formError(message, this.getFormErrorRedirect(err, message), cb);
    };

    /**
     *
     * @method getFormErrorRedirect
     * @param {Error} err
     * @param {String} message
     * @return
     */
    DeleteController.prototype.getFormErrorRedirect = function(/*err, message*/) {
        return '/';
    };

    /**
     *
     * @method getDeleteCollection
     * @return {String}
     */
    DeleteController.prototype.getDeleteCollection = function() {
        return 'IS NOT IMPLEMENTED';
    };

    /**
     *
     * @method getSuccessRedirect
     * @return {String}
     */
    DeleteController.prototype.getSuccessRedirect = function() {
        return pb.UrlService.createSystemUrl('/', { hostname: this.hostname });
    };

    /**
     *
     * @method getDataOnSuccess
     * @param {Array} results
     * @return {object}
     */
    DeleteController.prototype.getDataOnSuccess = function(/*results*/) {
        return pb.RequestHandler.generateRedirect(this.getSuccessRedirect());
    };

    /**
     *
     * @method getDefaultErrorMessage
     * @return {String}
     */
    DeleteController.prototype.getDefaultErrorMessage = function() {
        return this.ls.g('generic.ERROR_SAVING');
    };

    return DeleteController;
};
