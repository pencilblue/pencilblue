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

// dependencies
const async = require('async');

module.exports = function ViewControllerModule(pb) {
  const util = pb.util;
  const BaseController = pb.BaseController;

  /**
   *
   * @class View Controller
   * @constructor
   * @extends BaseController
   */
  class ViewController extends BaseController {

    constructor() {
      super();
      /**
       * Returns the path to the view template.  Must be implemented by the
       * extending controller prototype.
       * @method getView
       * @return {String}
       */
      this.getView = () => {
        throw new Error('getView must be overriden by the extending controller prototype');
      };

      /**
       * Called before the controller attempts to render the view
       * @method beforeTemplateLoad
       * @param {Function} cb
       */
      this.beforeTemplateLoad = (cb) => {
        cb(/*no-op*/);
      };
    }

    /**
     * Returns the path to the view template.  Must be implemented by the
     * extending controller prototype.
     * @method render
     * @param {String} view
     */
    render(view, cb) {
      let callback = cb;
      let viewTemplate = view;
      if (util.isFunction(view)) {
        callback = view;
        viewTemplate = null;
      }

      const tasks = [
        // call custom pre-load task
        util.wrapTask(this, this.beforeTemplateLoad),
        // load the template
        (taskCallback) => {
          this.loadTemplate(viewTemplate, taskCallback);
        },
      ];
      async.series(tasks, (err, results) => {
        // we know the load task will always be last so we retrieve the result for that task
        this.onRenderComplete(err, results[tasks.length - 1], callback);
      });
    }

    /**
     * Loads the template with the view provided by the extending controller
     * prototype implementation.
     * @method loadTemplate
     * @param {Function} cb
     */
    loadTemplate(view, cb) {
      this.ts.load(view || this.getView(), cb);
    }

    /**
     * Inspects the result of the controller's execution
     * prototype implementation.
     * @method onRenderComplete
     * @param {Error} err
     * @param {String} viewContent
     * @param {Function} cb
     */
    onRenderComplete(err, viewContent, cb) {
      if (util.isError(err)) {
        return this.reqHandler.serveError(err);
      }
      // all ok send back what we rendered
      return cb({
        content: viewContent,
      });
    }

  }
  return ViewController;
};
