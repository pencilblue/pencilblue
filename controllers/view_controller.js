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

module.exports = function ViewControllerModule(pb) {
    
    var util           = pb.util;
    var BaseController = pb.BaseController;
    
    /**
     * 
     * @class View Controller
     * @constructor
     * @extends BaseController
     */
    function ViewController(){}
    util.inherits(ViewController, BaseController);
    
    /**
     * Returns the path to the view template.  Must be implemented by the 
     * extending controller prototype.
     * @method getView
     * @return {String}
     */
    ViewController.prototype.getView = function() {
        throw new Error('getView must be overriden by the extending controller prototype');
    };
    
    /**
     * Called before the controller attempts to render the view
     * @method beforeTemplateLoad
     * @param {Function} cb
     */
    ViewController.prototype.beforeTemplateLoad = function(cb) {
        cb(/*no-op*/);
    };
    
    /**
     * Returns the path to the view template.  Must be implemented by the 
     * extending controller prototype.
     * @method render
     * @param {String} view
     */
    ViewController.prototype.render = function(view, cb) {
        if (util.isFunction(view)) {
            cb = view;
            view = null;
        }
        
        var self  = this;
        var tasks = [
            
            //call custom pre-load task
            util.wrapTask(this, this.beforeTemplateLoad),
            
            //load the template
            function(callback) {
                self.loadTemplate(view, callback);
            }
        ];
        async.series(tasks, function(err, results) {
            
            //we know the load task will always be last so we retrieve the result for that task
            self.onRenderComplete(err, results[tasks.length - 1], cb);
        });
    };
    
    /**
     * Loads the template with the view provided by the extending controller 
     * prototype implementation.
     * @method loadTemplate
     * @param {Function} cb
     */
    ViewController.prototype.loadTemplate = function(view, cb) {
        this.ts.load(view || this.getView(), cb);
    };
    
    /**
     * Inspects the result of the controller's execution
     * prototype implementation.
     * @method onRenderComplete
     * @param {Error} err
     * @param {String} viewContent
     * @param {Function} cb
     */
    ViewController.prototype.onRenderComplete = function(err, viewContent, cb) {
        if (util.isError(err)) {
            return this.reqHandler.serveError(err);
        }
        
        //all ok send back what we rendered
        cb({
            content: viewContent
        });
    };
    
    return ViewController;
};