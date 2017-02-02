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
const _ = require('lodash');
const Q = require('q');

class PromiseUtils {

    /**
     * Provides reusable code for promise loops.
     * http://stackoverflow.com/questions/17217736/while-loop-with-promises
     * @param condition
     * @param body
     * @returns {*}
     */
    static whilst (condition, body) {
        var done = Q.defer();

        function loop() {
            // When the result of calling `condition` is no longer true, we are
            // done.
            if (!condition()) {
                return done.resolve();
            }
            // Use `when`, in case `body` does not return a promise.
            // When it completes loop again otherwise, if it fails, reject the
            // done promise
            Q.when(body(), loop, done.reject);
        }

        // Start running the loop in the next tick so that this function is
        // completely async. It would be unexpected if `body` was called
        // synchronously the first time.
        Q.nextTick(loop);

        // The promise
        return done.promise;
    }

    /**
     * Creates a basic handler that resolves or rejects a deferred promise by checking to see if an error was passed via
     * the callback
     * @param {Deferred} deferred
     * @param {function} [transform] A function that takes a single parameter and can manipulate and return the
     * transformed result.  The new result will be the resolved value for the deferred promise.
     * @returns {Function}
     */
    static cbHandler (deferred, transform) {
        return function(err, result) {
            if (_.isError(err)) {
                return deferred.reject(err);
            }
            if (_.isFunction(transform)) {
                result = transform(result);
            }
            deferred.resolve(result);
            return deferred.promise;
        };
    }
}

module.exports = PromiseUtils;
