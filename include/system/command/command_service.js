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

//dependencies
var _ = require('lodash');
var async = require('async');
var Configuration = require('../../config');
var domain = require('domain');
var log = require('../../utils/logging').newInstance('CommandService');
var MongoCommandBroker = require('./mongo_command_broker');
var RedisCommandBroker = require('./redis_command_broker');
var ServerRegistration = require('../server_registration');
var System = require('../../system/system');
var TaskUtils = require('../../../lib/utils/taskUtils');
var uuid = require('uuid');
var ValidationService = require('../../validation/validation_service');

/**
 * The singleton instance
 * @private
 * @static
 * @property INSTANCE
 * @type {CommandService}
 */
var INSTANCE = null;

/**
 * The singleton instance
 * @private
 * @static
 * @property INITIALIZED
 * @type {boolean}
 */
var INITIALIZED = false;

/**
 * Provides a mechanism to send commands to all members of the cluster or a
 * specific member.
 * @class CommandService
 * @constructor
 * @param {CommandBroker} broker
 */
class CommandService {
    constructor(broker) {
        if (!broker) {
            throw new Error('The broker parameter is required');
        }
        this.broker = broker;
        this.registrants = {};
        this.awaitingResponse = {};
    }

    /**
     * The default timeout in milliseconds (2 seconds)
     * @private
     * @static
     * @readonly
     * @property DEFAULT_TIMEOUT
     * @type {Integer}
     */
    static get DEFAULT_TIMEOUT() {
        return 2000;
    }

    /**
     * A hash of the brokers that are available out of the box
     * @private
     * @static
     * @property AWAITING_RESPONSE
     * @type {Object}
     */
    static get DEFAULT_BROKERS() {
        return {
            redis: RedisCommandBroker,
            mongo: MongoCommandBroker
        };
    }

    /**
     * Indicates that an error occurrred while attempting to check if a handler was registered
     * @static
     * @readonly
     * @property ERROR_INDEX
     * @type {number}
     */
    static get ERROR_INDEX() {
        return -2;
    }

    /**
     * Indicates that the handler was not found
     * @static
     * @readonly
     * @property NOT_FOUND
     * @type {number}
     */
    static get NOT_FOUND() {
        return -1;
    }

    /**
     * Initializes the service and the broker implementation.  The broker is
     * determined by the configuration value of "command.broker".  This value can
     * be "redis" for the out of the box implementation for Redis or an absolute
     * path to another implementation.
     * @method init
     * @param {Function} cb A callback that takes two parameters: cb(Error, TRUE/FALSE)
     */
    static init(cb) {
        if (INITIALIZED) {
            return cb(null, true);
        }
        log.debug('CommandService: Initializing...');

        //instantiate the command broker
        var self = this;
        this.broker.init(function (err) {
            if (_.isError(err)) {
                return cb(err);
            }

            self.broker.subscribe(ServerRegistration.generateKey(), CommandService.onCommandReceived(self), function (error, result) {
                INITIALIZED = !_.isError(error);
                cb(err, result);
            });
        });

        //register for events
        System.registerShutdownHook('CommandService', TaskUtils.wrapTask(this, this.shutdown));
    }

    /**
     * Shuts down the command service and the broker if initialized
     * @method shutdown
     * @param {Function} cb A callback that takes two parameters: cb(Error, TRUE/FALSE)
     */
    shutdown(cb) {
        log.debug('Shutting down...');

        this.registrants = {};
        if (!this.broker) {
            return cb(null, true);
        }
        this.broker.shutdown(cb);
    }

    /**
     * Registers a handler for incoming commands of the specified type.
     * @method registerForType
     * @param {String} type The name/type of the command to handle
     * @param {Function} handler A function that takes two parameters:
     * handler(channel, command). where channel is a string and command is an
     * object.
     * @return {Boolean} TRUE if the the handler was registered, FALSE if not.
     */
    registerForType(type, handler) {
        var result = this.isRegistered(type, handler);
        if (result !== CommandService.NOT_FOUND && !!this.registrants[type]) {
            return false;
        }

        //ensure there is a holder for the type
        if (!this.registrants[type]) {
            this.registrants[type] = [];
        }

        this.registrants[type].push(handler);
        return true;
    }

    /**
     * Unregisters a handler for the specified type.
     * @method unregisterForType
     * @param {String} type The name/type of the command that the handler is
     * registered for
     * @param {Function} handler The handler function to unregister
     * @return {Boolean} TRUE if the handler was unregistered, FALSE if not.
     */
    unregisterForType(type, handler) {
        var index = this.isRegistered(type, handler);
        var result = index > CommandService.NOT_FOUND;
        if (result) {
            this.registrants[type].splice(index, 1);
        }
        return result;
    }

    /**
     * Determines if the provided handler is registered for the given type.
     * @method isRegistered
     * @param type
     * @param handler
     * @return {number} The index in the storage array where the handle to
     * the function is kept.  CommandService.NOT_FOUND if the handle is not
     * registered for the type.  CommandService.ERROR_INDEX when the
     * parameters are invalid.
     */
    isRegistered(type, handler) {
        if (!ValidationService.isNonEmptyStr(type, true) || !_.isFunction(handler) || !Array.isArray(this.registrants[type])) {
            return CommandService.ERROR_INDEX;
        }

        for (var i = 0; i < this.registrants[type].length; i++) {
            if (handler === this.registrants[type][i]) {
                return i;
            }
        }
        return CommandService.NOT_FOUND;
    }

    /**
     * Responsible for delegating out the received command to the registered
     * handlers.  The command parameter must be an object, must have a type
     * property that is a string, and must have a registered handler for the
     * specified type.
     * @method notifyOfCommand
     * @param {Object} command The command to delegate
     */
    notifyOfCommand(command) {
        if (!_.isObject(command)) {
            return;
        }

        var type = command.type;
        if (!ValidationService.isNonEmptyStr(type, true)) {
            return;
        }

        if (!Array.isArray(this.registrants[type])) {
            log.warn('CommandService: Command of type [%s] was received but there are no registered handlers.', type);
            return;
        }

        //check if this is a response to a message that was sent
        if (command.replyTo) {
            if (this.awaitingResponse[command.replyTo]) {
                this.awaitingResponse[command.replyTo](command);
            }
            else {
                log.warn('CommandService: The command was in reply to [%s] but no callback was registered. Skipping.', command.replyTo);
            }
            return;
        }

        //emit command to each handler
        var self = this;
        var emitFunction = function (type, i, command) {
            return function () {
                self.registrants[type][i](command);
            };
        };
        for (var i = 0; i < this.registrants[type].length; i++) {
            process.nextTick(emitFunction(type, i, command));
        }
    }

    /**
     * Sends a command to all processes iin the cluster and waits for a response
     * from all before calling back.
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
    sendCommandToAllGetResponses(type, options, cb) {
        if (_.isFunction(options)) {
            cb = options;
            options = {};
        }
        else if (!options) {
            options = {};
        }
        else if (!_.isObject(options)) {
            cb(new Error('The options parameter must be an object'));
            return;
        }

        //set the progress callback
        var progressCb = null;
        if (_.isFunction(options.progress)) {
            progressCb = options.progress;
        }
        delete options.progress;

        //get all processes in the cluster
        var self = this;
        ServerRegistration.getInstance().getClusterStatus(function (err, statuses) {
            if (_.isError(err)) {
                cb(err);
                return;
            }

            var me = null;
            var myKey = ServerRegistration.generateKey();
            var tasks = statuses.map(function (status, i, statuses) {
                if (myKey === statuses[i]._id) {
                    me = i;
                }

                //create the task function
                return function (callback) {

                    //make progress callback
                    if (progressCb) {
                        progressCb(i, statuses.length);
                    }

                    //create command
                    var opts = _.clone(options);
                    opts.to = statuses[i].id;

                    //execute command against the cluster
                    self.sendCommandGetResponse(type, opts, function (err, command) {
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
    }

    /**
     * Sends a command to a single process in the cluster expecting a response.
     * @method sendCommandGetResponse
     * @param {String} type
     * @param {Object} options
     * @param {String} options.to
     * @param {Integer} [options.timeout]
     * @param{Function} onResponse
     */
    sendCommandGetResponse(type, options, onResponse) {
        if (!_.isObject(options) || !ValidationService.isNonEmptyStr(options.to, true)) {
            return onResponse(new Error('A to field must be provided when expecting a response to a message.'));
        }

        var self = this;
        var doSend = function (type, options, onResponse) {

            var timeout = options.timeout || Configuration.active.command.timeout || CommandService.DEFAULT_TIMEOUT;
            var d = domain.create();
            d.on('error', onResponse);
            d.run(function () {
                self.sendCommand(type, options, function (err, commandId) {
                    if (_.isError(err)) {
                        onResponse(err);
                        return;
                    }
                    else if (!ValidationService.isNonEmptyStr(commandId, true)) {
                        onResponse(new Error('Failed to publish the command to the cluster'));
                        return;
                    }

                    var handle = setTimeout(function () {
                        delete self.awaitingResponse[commandId];
                        onResponse(new Error('Timed out waiting for response to command [' + commandId + ']'));
                        handle = null;
                    }, timeout);
                    self.awaitingResponse[commandId] = function (command) {
                        if (handle) {
                            clearTimeout(handle);
                            handle = null;
                            onResponse(null, command);
                        }
                        else {
                            log.silly('CommandService: A response to command [%s] came back but it was after the timeout. %s', commandId, JSON.stringify(command));
                        }
                        delete self.awaitingResponse[commandId];
                    };
                });
            });
        };
        doSend(type, options, onResponse);
    }

    /**
     * Provides a mechanism to respond to a the entity that sent the command.
     * @method sendInResponseTo
     * @param {Object} command The command that was sent to ths process
     * @param {Object} responseCommand The command to send back to the entity that sent the first command.
     * @param {Function} [cb] A callback that provides two parameters: cb(Error, Command ID)
     */
    sendInResponseTo(command, responseCommand, cb) {
        if (!_.isObject(command)) {
            return cb(new Error('The command parameter must be an object'));
        }

        if (!_.isObject(responseCommand)) {
            responseCommand = {};
        }

        //ensure a callback
        cb = cb || function () {
            };

        //complete the response
        responseCommand.id = uuid.v4();
        responseCommand.to = command.from;
        responseCommand.replyTo = command.id;

        //send the response
        var type = responseCommand.type || command.type;
        this.sendCommand(type, responseCommand, cb);
    }

    /**
     * Sends a command to the cluster
     * @method sendCommand
     * @param {String} type The command name/type
     * @param {Object} [options] The options that will be serialized and sent to the other processes in the cluster
     * @param {String} [options.to] The cluster process that should handle the message
     * @param {Function} [cb] A callback that provides two parameters: cb(Error, Command ID)
     */
    sendCommand(type, options, cb) {
        if (!ValidationService.isNonEmptyStr(type, true)) {
            return cb(new Error("The command type is required"));
        }
        else if (_.isFunction(options)) {
            cb = options;
            options = {};
        }
        else if (!ValidationService.isObj(options, false)) {
            return cb(new Error('When provided the options parameter must be an object'));
        }

        //ensure a callback is provided
        cb = cb || function () {
            };

        //ensure an options object
        if (!options) {
            options = {};
        }

        //set who its from
        options.from = ServerRegistration.generateKey();
        options.type = type;
        options.date = new Date();

        //ensure each command is sent with an ID.  Allow the ID to already be set
        //in the event that we are sending a response.
        if (!options.id) {
            options.id = uuid.v4();
        }

        //instruct the broker to broadcast the command
        var tasks = [
            TaskUtils.wrapTask(this, this.init),
            TaskUtils.wrapTask(this.broker, this.broker.publish, [options.to, options])
        ];
        async.series(tasks, function (err, results) {
            cb(err, results[tasks.length - 1] ? options.id : null);
        });
    }

    /**
     * The global handler for incoming commands.  It registers itself with the
     * broker and then when messages are received it verifies that the message is
     * meant for this member of the cluster (or all members) then proceeds to
     * handoff to the function that will delegate out to the handlers.
     * @static
     * @method onCommandReceived
     * @param {CommandService} commandService
     * @return {Function} (string, object)
     */
    static onCommandReceived(commandService) {
        return function (channel, command) {

            var uid = ServerRegistration.generateKey();
            if (command.to === uid || command.to === null || command.to === undefined) {
                commandService.notifyOfCommand(command);
            }
            else {
                //skip because it isn't addressed to us
                log.silly('CommandService: The command was not addressed to me [%s] but to [%s]. Skipping.', uid, command.to);
            }
        };
    }

    /**
     * Retrieves the singleton instance of CommandService.
     * @static
     * @method getInstance
     * @return {CommandService}
     */
    static getInstance() {
        if (INSTANCE) {
            return INSTANCE;
        }

        //figure out which broker to use
        var CommandBroker = null;
        var config = Configuration.active;
        if (CommandService.DEFAULT_BROKERS[config.command.broker]) {
            CommandBroker = CommandService.DEFAULT_BROKERS[config.command.broker];
        }
        else {
            CommandBroker = require(config.command.broker);
        }

        var broker = new CommandBroker();
        INSTANCE = new CommandService(broker);
        return INSTANCE;
    }
}

module.exports = CommandService;
