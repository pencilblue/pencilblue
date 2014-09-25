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
 * Provides a mechanism to send commands to all members of the cluster or a
 * specific member.
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
 * @private
 * @property COMMAND_CHANNEL
 * @type {String}
 */
var COMMAND_CHANNEL = 'pencilblue-command-channel';

/**
 * A hash of the commands that were sent and expect a response.  Each hash key
 * contains a callback function that will be called when either the receiving
 * entity responds or the timeout occurs.
 * @private
 * @static
 * @property AWAITING_RESPONSE
 * @type {Object}
 */
var AWAITING_RESPONSE = {};

/**
 * Initializes the service and the broker implementation.  The broker is
 * determined by the configuration value of "command.broker".  This value can
 * be "redis" for the out of the box implementation for Redis or an absolute
 * path to another implementation.
 * @static
 * @method init
 * @param {Function} cb A callback that takes two parameters: cb(Error, TRUE/FALSE)
 */
CommandService.init = function(cb) {
    pb.log.debug('CommandService: Initializing...');

    //figure out which broker to use
    var BrokerPrototype = null;
    if (pb.config.command.broker === 'redis') {
        BrokerPrototype = pb.RedisCommandBroker;
    }
    else {
        try {
            BrokerPrototype = require(pb.config.command.broker);
        }
        catch(e){
            pb.log.error('CommandService: Failed to load CommandBroker implementation at [%s]. %s', pb.config.command.broker, e.stack);
        }
    }

    //ensure a broker was found
    if (!BrokerPrototype) {
        cb(new Error('A valid CommandBroker must be provided in order to initialize the CommandService'));
    }

    //instantiate the command broker
    BROKER = new BrokerPrototype();
    BROKER.init(function(err, result) {
        if (util.isError(err)) {
            cb(err);
            return;
        }

        BROKER.subscribe(COMMAND_CHANNEL, CommandService.onCommandReceived, cb);
    });
};

/**
 * Shuts down the command service and the broker if initialized
 * @static
 * @method shutdown
 * @param {Function} cb A callback that takes two parameters: cb(Error, TRUE/FALSE)
 */
CommandService.shutdown = function(cb) {
    pb.log.debug('CommandService: Shutting down...');

    REGISTRANTS = {};
    if (BROKER) {
        BROKER.shutdown(cb);
    }
    else {
        cb(null, true);
    }
};

/**
 * Registers a handler for incoming commands of the specified type.
 * @static
 * @method registerForType
 * @param {String} type The name/type of the command to handle
 * @param {Function} handler A function that takes two parameters:
 * handler(channel, command). where channel is a string and command is an
 * object.
 * @return {Boolean} TRUE if the the handler was registered, FALSE if not.
 */
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

/**
 * Unregisters a handler for the specified type.
 * @static
 * @method unregisterForType
 * @param {String} type The name/type of the command that the handler is
 * registered for
 * @param {Function} handler The handler function to unregister
 * @return {Boolean} TRUE if the handler was unregistered, FALSE if not.
 */
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

/**
 * Responsible for delegating out the received command to the registered
 * handlers.  The command parameter must be an object, must have a type
 * property that is a string, and must have a registered handler for the
 * specified type.
 * @static
 * @method notifyOfCommand
 * @param {Object} command The command to delegate
 */
CommandService.notifyOfCommand = function(command) {
    if (!pb.utils.isObject(command)) {
        return;
    }

    var type = command.type;
    if (!pb.validation.validateNonEmptyStr(type, true)) {
        return;
    }

    if (!util.isArray(REGISTRANTS[type])) {
        pb.log.warn('CommandService: Command of type [%s] was received but there are no registered handlers.', type);
        return;
    }

    //check if this is a response to a message that was sent
    if (command.isResponse && AWAITING_RESPONSE[command.id]) {
        AWAITING_RESPONSE[command.id](command);
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
 * Sends a command to all processes iin the cluster and waits for a response
 * from all before calling back.
 * @static
 * @method sendCommandToAllGetResponses
 * @param {String} type The name/type of the command being sent
 * @param {Object} [options] The options for the command.  The options object
 * becomes the command object.  Custom properties to be part of the command can
 * be added.  However, certain properties do have special meaning such as "id",
 * "to", "from", "timeout", "includeme".  These special properties may be
 * overriden by this function or one it calls in order for the commands to
 * function properly.
 * @param {String} [options.id]
 * @param {Boolean} [options.ignoreme]
 * @param {Integer} [options.timeout=2000] Timeout in milliseconds for each
 * process to respond.
 * @param {Function} [options.progress] A function called right before each
 * command is sent.  The function should take two parameters.  The first is the
 * index of the task being executed and the second is the total number of tasks.
 * @param {Function} cb A callback that provides two parameters: cb(Error, Array)
 */
CommandService.sendCommandToAllGetResponses = function(type, options, cb) {
    if (pb.utils.isFunction(options)) {
        cb = options;
        options = {};
    }
    else if (!options) {
        options = {};
    }
    else if (!pb.utils.isObject(options)) {
        cb(new Error('The options parameter must be an object'));
        return;
    }

    //set the progress callback
    var progressCb = null;
    if (pb.utils.isFunction(options.progress)) {
        progressCb = options.progress;
    }
    delete options.progress;

    //get all proceses in the cluster
    var serverResigration = new pb.ServerRegistration();
    serverResigration.getClusterStatus(function(err, statuses) {
        if (util.isError(err)) {
            cb(err);
            return;
        }

        var me    = null;
        var myKey = pb.ServerRegistration.generateKey();
        var tasks = pb.utils.getTasks(statuses, function(statuses, i) {
            if (myKey === statuses[i]._id) {
                me = i;
            }

            //create the task function
            return function(callback) {

                //make progress callback
                if (progressCb) {
                    progressCb(i, statuses.length);
                }

                //create command
                var opts = pb.utils.clone(options);
                opts.to  = statuses[i].id;

                //execute command against the cluster
                CommandService.sendCommandGetResponse(type, opts, function(err, command) {
                    var result = {
                        err: err ? err.stack : undefined,
                        command: command
                    };
                    callback(null, result);
                });
            };
        });

        //remove me if specified
        if (options.ignoreme && me !== null) {
            tasks.splice(me, 1);
        }

        //send commands for each process
        async.series(tasks, cb);
    });
};

/**
 * Sends a command to a single process in the cluster expecting a response.
 * @static
 * @method sendCommandGetResponse
 * @param {String} type
 * @param {Object} options
 * @param{Function} onResponse
 */
CommandService.sendCommandGetResponse = function(type, options, onResponse) {
    if (!pb.utils.isObject(options) || !pb.validation.validateNonEmptyStr(options.to, true)) {
        onResponse(new Error('A to field must be provided when expecting a response to a message.'));
        return;
    }

    var doSend = function(type, options, onResponse) {

        var timeout = options.timeout || 2000;
        var d       = domain.create();
        d.on('error', onResponse);
        d.run(function() {
            CommandService.sendCommand(type, options, function(err, commandId) {
                if (util.isError(err)) {
                    onResponse(err);
                    return;
                }
                else if (!pb.validation.validateNonEmptyStr(commandId, true)) {
                    onResponse(new Error('Failed to publish the command to the cluster'));
                    return;
                }

                var handle = setTimeout(function() {
                    delete AWAITING_RESPONSE[commandId];
                    onResponse(new Error('Timed out waiting for response to command ['+commandId+']'));
                    handle = null;
                }, timeout);
                AWAITING_RESPONSE[commandId] = function(command) {
                    if (handle) {
                        clearTimeout(handle);
                        handle = null;
                        onResponse(null, command);
                    }
                    else {
                        pb.log.silly('CommandService: A response to command [%s] came back but it was after the timeout. %s', commandId, JSON.stringify(command));
                    }
                    delete AWAITING_RESPONSE[commandId];
                };
            });
        });
    }
    doSend(type, options, onResponse);
};

/**
 * Provides a mechanism to respond to a the entity that sent the command.
 * @static
 * @method sendInResponseTo
 * @param {Object} command The command that was sent to ths process
 * @param {Object} responseCommand The command to send back to the entity that sent the first command.
 * @param {Function} cb A callback that provides two parameters: cb(Error, Command ID)
 */
CommandService.sendInResponseTo = function(command, responseCommand, cb) {
    if (!pb.utils.isObject(command)) {
        cb(new Error('The command parameter must be an object'));
        return;
    }

    if (!pb.utils.isObject(responseCommand)) {
        responseCommand = {};
    }

    //ensure a callback
    cb = cb || pb.utils.cb;

    //complete the response
    responseCommand.id         = command.id;
    responseCommand.to         = command.from;
    responseCommand.isResponse = true;

    //send the response
    var type = responseCommand.type || command.type;
    CommandService.sendCommand(type, responseCommand, cb);
};

/**
 * Sends a command to the cluster
 * @static
 * @method sendCommand
 * @param {String} type The command name/type
 * @param {Object} [options] The options that will be serialized and sent to the other processes in the cluster
 * @param {String} [options.to] The cluster process that should handle the message
 * @param {Function} [cb] A callback that provides two parameters: cb(Error, Command ID)
 */
CommandService.sendCommand = function(type, options, cb) {
    if (!pb.validation.validateNonEmptyStr(type, true)) {
        cb(new Error("The command type is required"));
        return;
    }
    else if (pb.utils.isFunction(options)) {
        cb = options;
        options = {};
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
    options.from = pb.ServerRegistration.generateKey();
    options.type = type;
    options.date = new Date();

    //ensure each command is sent with an ID.  Allow the ID to already be set
    //in the event that we are sending a response.
    if (!options.id) {
        options.id = pb.utils.uniqueId().toString();
    }

    //instruct the broker to broadcast the command
    BROKER.publish(COMMAND_CHANNEL, options, function(err, result) {
        cb(err, result ? options.id : null);
    });
};

/**
 * The global handler for incoming commands.  It registers itself with the
 * broker and then when messages are received it verifies that the message is
 * meant for this member of the cluster (or all members) then proceeds to
 * handoff to the function that will delegate out to the handlers.
 * @static
 * @method onCommandReceived
 * @param {String} channel The channel to listen for incoming commands
 * @param {Object} command The command to verify and delegate
 */
CommandService.onCommandReceived = function(channel, command) {
    var uid = pb.ServerRegistration.generateKey();
    if (command.to === uid || command.to === null || command.to === undefined) {
        CommandService.notifyOfCommand(command);
    }
    else {
        //skip because it isn't addressed to us
        pb.log.silly('CommandService: The command was not addressed to me [%s] but to [%s]. Skipping.', uid, command.to);
    }
};

//register for events
pb.system.registerShutdownHook('CommandService', CommandService.shutdown);

//exports
module.exports = CommandService;
