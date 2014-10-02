/*
    Copyright (C) 2014  PencilBlue, LLC

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

/**
 * Wraps up code that allows developers the ability to time box errors.  In 
 * some instances errors will occur.  It is only when a certain number of those 
 * errors occur within a given time span that it is recognized that recovery is 
 * improbable.  When the threshold is broken the code allows you to throw an 
 * error that represents all others that contributed to the threshold breach.
 * @class ErrorsOverTime
 * @constructor
 * @param {Integer} errorSpan The upper bound on the number of errors that can 
 * occur within the provided time frame before it is determined that recovery 
 * is not possible.
 * @param {Integer} errorThreshold The upper bound on the amount of time, in 
 * milliseconds, that errors can occur in before it is determined that recovery 
 * is not possible.
 */
function ErrorsOverTime(errorSpan, errorThreshold) {
    
    /**
     * The upper bound on the number of errors that can occur within the provided 
     * time frame before it is determined that recovery is not possible.
     * @property errorSpan
     * @type {Integer}
     */
    this.errorSpan = errorSpan;
    
    /**
     * The upper bound on the amount of time, in milliseconds, that errors can 
     * occur in before it is determined that recovery is not possible.
     * @property errorThreshold
     * @type {Integer}
     */
    this.errorThreshold = errorThreshold;
    
    /**
     * The list of errors that will be used to determin if too many errors have 
     * occurred within a given time frame.
     * @property errors
     * @type {Array}
     */
    this.errors = [];
    
    /**
     * The total number of errors that have occurred
     * @property totalErrorCnt
     * @type {Integer}
     */
    this.totalErrorCnt = 0;
};

/**
 * Adds an error into the calculation to determine if too many errors have 
 * occurred within a particular time span. If the threshold has been broken an 
 * error is thrown.
 * @method throwIfOutOfBounds
 * @param {Error} The error that occurred
 * @param {String} prefix The error message text that will come first
 * @return {Boolean} TRUE if threshold is in tact, FALSE if not
 */
ErrorsOverTime.prototype.throwIfOutOfBounds = function(err, prefix) {
    if (!this.errorOccurred(err)) {
        ErrorsOverTime.generateError(this.errors, prefix);
    }
    return true;
};

/**
 * Adds an error into the calculation to determine if too many errors have 
 * occurred within a particular time span.
 * @method errorOccurred
 * @param {Error} The error that occurred
 * @return {Boolean} TRUE if threshold is in tact, FALSE if not
 */
ErrorsOverTime.prototype.errorOccurred = function(err) {
    
    //add the error
    this.totalErrorCnt++;
    this.errors.push(err);
    
    //shave off any errors that are outside of our span
    if (this.erors.length > this.errorSpan) {
        this.errors.splice(0, 1);
    }
    
    return this.isWithinLimits();
};

/**
 * Determines if the errors that have occurred are within the acceptable tolerance.
 * @method isWithinLimits
 * @return {Boolean} TRUE if threshold in tact, FALSE if not
 */
ErrorsOverTime.prototype.isWithinLimits = function() {
    
    var withinLimits = true;
    if (this.errors.length >= this.errorSpan) {
        
        var range = this.errors[this.errors.length - 1] - this.errors[this.errors.length - this.errorSpan];
        withinLimits = range > this.errorThreshold;
    }
    return withinLimits;
};

/**
 * Generates and throws an Error that represents all of the errors that 
 * triggered the threshold breach.
 * @static
 * @method generateError
 * @param {Array} errors The array of errors that will be represented by one 
 * wrapper error
 * @param {String} prefix The error message text that will come first
 */
ErrorsOverTime.generateError = function(errors, prefix) {
    throw ErrorsOverTime.createError(errors, prefix);
};

/**
 * Creates an Error that represents all of the errors that triggered the 
 * threshold breach.
 * @static
 * @method createError
 * @param {Array} errors The array of errors that will be represented by one 
 * wrapper error
 * @param {String} prefix The error message text that will come first
 * @return {Error}
 */
ErrorsOverTime.createError = function(errors, prefix) {
    if (!prefix) {
        prefix = '';
    }
    
    var pattern = prefix + 'Threshold breached by:----------------------------------------';
    errors.forEach(function(errItem) {
        pattern += '\n' + errItem.stack;
    });
    pattern += '----------------------------------------';
    
    return new Error(pattern);
};

//exports
module.exports = ErrorsOverTime;
