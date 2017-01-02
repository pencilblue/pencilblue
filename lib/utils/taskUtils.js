/*
 Copyright (C) 2016  PencilBlue, LLC

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

class TaskUtils {

    /**
     * Creates a set of tasks that can be executed by the "async" module.
     * @static
     * @method getTasks
     * @param {Array} iterable The array of items to build tasks for
     * @param {Function} getTaskFunction The function that creates and returns the
     * task to be executed.
     * @example
     * <code>
     * var items = ['apple', 'orange'];
     * var tasks = util.getTasks(items, function(item, i, items) {
     *     return function(callback) {
     *         console.log(items[i]);
     *         callback(null, null);
     *     };
     * });
     * async.series(tasks, util.cb);
     * <code>
     */
    static getTasks (iterable, getTaskFunction) {
        return iterable.map(getTaskFunction);
    }

    /**
     * Wraps a task in a context as well as a function to mark the start and end time.  The result of the task will be
     * provided in the callback as the "result" property of the result object.  The time of execution can be found as the
     * "time" property.
     * @static
     * @method wrapTimedTask
     * @param {*} context The value of "this" for the function to be called
     * @param {function} func The function to be executed
     * @param {string} [name] The task's name
     * @param {Array} [argArray] The arguments to be supplied to the func parameter
     * when executed.
     * @return {function}
     */
    static wrapTask (context, func, argArray) {
        if (!Array.isArray(argArray)) {
            argArray = [];
        }
        return function(callback) {
            argArray.push(callback);
            func.apply(context, argArray);
        };
    }

    /**
     * Wraps a task in a context as well as a function to mark the start and end time.  The result of the task will be
     * provided in the callback as the "result" property of the result object.  The time of execution can be found as the
     * "time" property.
     * @param {*} context The value of "this" for the function to be called
     * @param {Function} func The function to be executed
     * @param {string} [name] The task's name
     * @param {Array} [argArray] The arguments to be supplied to the func parameter
     * when executed.
     * @return {Function}
     */
    static wrapTimedTask (context, func, name, argArray) {
        if (typeof argArray === 'string') {
            name = argArray;
            argArray = [];
        }
        var task = TaskUtils.wrapTask(context, func, argArray);
        return TaskUtils.timedTask(task);
    }

    static wrapPromiseTask (context, func, argArray) {
        return function(callback) {
            func.apply(context, argArray).catch(callback).then(function(result) {
                callback(null, result);
            });
        };
    }

    static wrapTimedPromiseTask (context, func, name, argArray) {
        if (typeof argArray === 'string') {
            name = argArray;
            argArray = [];
        }

        var task = TaskUtils.wrapPromiseTask(context, func, argArray);
        return TaskUtils.timedTask(task);
    }

    static timedTask (task, name) {
        return function(callback) {
            var start = Date.now();
            task(function(err, result) {
                callback(err, {
                    result: result,
                    time: Date.now() - start,
                    start: start,
                    name: name
                });
            });
        };
    }
}

module.exports = TaskUtils;
