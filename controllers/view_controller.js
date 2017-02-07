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
'use strict';

//dependencies
var _ = require('lodash');
var async = require('async');
var BaseController = require('./base_controller');

/**
 * @extends BaseController
 */
class ViewController extends BaseController {
    constructor() {
        super();
    }

    /**
     * Returns the path to the view template.  Must be implemented by the
     * extending controller prototype.
     * @return {String}
     */
    getView() {
        throw new Error('getView must be overridden by the extending controller prototype');
    };

    /**
     * Called before the controller attempts to render the view
     * @method beforeTemplateLoad
     * @param {Function} cb
     */
    beforeTemplateLoad(cb) {
        cb(/*no-op*/);
    };

    /**
     * Returns the path to the view template.  Must be implemented by the
     * extending controller prototype.
     * @method render
     * @param {String} view
     */
    render(view, cb) {
        if (_.isFunction(view)) {
            cb = view;
            view = null;
        }

        var self = this;
        var tasks = [

            //call custom pre-load task
            TaskUtils.wrapTask(this, this.beforeTemplateLoad),

            //load the template
            function (callback) {
                self.loadTemplate(view, callback);
            }
        ];
        async.series(tasks, function (err, results) {

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
    loadTemplate(view, cb) {
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
    onRenderComplete(err, viewContent, cb) {
        if (_.isError(err)) {
            return cb(err);
        }

        //all ok send back what we rendered
        cb({
            content: viewContent
        });
    }
}

module.exports = ViewController;
