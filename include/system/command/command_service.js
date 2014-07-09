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

//dependencies

/**
 *
 * @class CommandService
 * @constructor
 */
function CommandService(){}

//statics
/**
 * @private
 * @property BROKER
 * @type {CommandBroker}
 */
var BROKER = null;

/**
 * @private
 * @property BROKER
 * @type {CommandBroker}
 */
var REGISTRANTS = {};

/**
 *
 * @static
 * @method init
 */
CommandService.init = function() {
    //initialize publish/subscribe interface here
};

CommandService.registerForType = function(type, handler) {
    if (!pb.validation.validateNonEmptyStr(type, true) || !pb.utils.isFunction(handler)) {
        return false;
    }

    //ensure there is a holder for the type
    if (!REGISTRANTS[type]) {
        REGISTRANTS[type] = [];
    }

    REGISTRANTS[type].push(handler);
    return true;
};

CommandService.unregisterForType = function(type, handler) {
    if (!pb.validation.validateNonEmptyStr(type, true) || !pb.utils.isFunction(handler)) {
        return false;
    }

    if (!util.isArray(REGISTRANTS[type])) {
        return false;
    }

    for (var i = 0; i < REGISTRANTS[type].length; i++) {
        if (handler === REGISTRANTS[type][i]) {
            REGISTRANTS[type].splice(i, 1);
            return true;
        }
    }
    return false;
};

CommandService.notifyOfCommand = function(command) {
    if (!pb.utils.isObject(command)) {
        return;
    }

    var type = command.type;
    if (!pb.validation.validateNonEmptyStr(type, true)) {
        return;
    }

    if (!util.isArray(REGISTRANTS[type])) {
        return;
    }

    //emit command to each handler
    var emitFunction = function(type, i, command){
        return function() {
            REGISTRANTS[type][i](command);
        };
    };
    for (var i = 0; i < REGISTRANTS[type].length; i++) {
        process.nextTick(emitFunction(type, i, command));
    }
};

/**
 * Sends a command to the cluster
 * @static
 * @method sendCommand
 * @param {String} type The command name/type
 * @param {Object} options The options that will be serialized and sent to the other processes in the cluster
 */
CommandService.sendCommand = function(type, options, cb) {
    if (!pb.validation.validateNonEmptyStr(type, true)) {
        cb(new Error("The command type is required"));
        return;
    }
    else if (!pb.validation.validateObject(options, false)) {
        cb(new Error('When provided the options parameter must be an object'));
        return;
    }

    //ensure a callback is provided
    cb = cb || pb.utils.cb;

    //ensure an options object
    if (!options) {
        options = {};
    }

    //set who its from
    options.from = '';//TODO fill this in
    options.type = type;
    options.date = new Date();

    BROKER.publish(command, cb);
};


CommandService.onCommandRecieved = function(channel, command) {
    var uid = '';//TODO fill this in
    if (command.to === uid || command.to === null || command.to === undefined) {
        CommandService.notifyOfCommand(command);
    }
    else {
        //skip because it isn't addressed to us
    }
};

//exports
module.exports = CommandService;
