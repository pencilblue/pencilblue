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
const _ = require('lodash');
const CacheFactory = require('../../dao/cache');
const log = require('../../utils/logging').newInstance('RedisCommandBroker');
const Q = require('q');
const ValidationService = require('../../validation/validation_service');

/**
 * The hash of handlers for each channel subscribed to
 * @private
 * @static
 * @property SUBSCRIBERS
 * @type {Object}
 */
var SUBSCRIBERS = {};

/**
 * Brokers messages using Redis as the medium.  The implementation follows a
 * publish/subscribe model that allows for listening for changes based on a a
 * specified channel.
 * @class RedisCommandBroker
 * @constructor
 */
class RedisCommandBroker {
    constructor() {

        /**
         * Client used to publish commands to the cluster
         * @property publishClient
         * @type {Client}
         */
        this.publishClient = null;

        /**
         * Client used to subscribe to commands to the cluster
         * @property publishClient
         * @type {Client}
         */
        this.subscribeClient = null;
    }

    /**
     * Initializes the broker by creating the connections to Redis and registering
     * for the message event.
     * @method init
     * @param {Function} cb A callback that provides two parameters: cb(Error, Boolean)
     */
    init(cb) {
        var self = this;

        this.publishClient = CacheFactory.getInstance();
        this.subscribeClient = CacheFactory.createInstance();
        this.subscribeClient.on('message', function (channel, command) {
            self.onCommandReceived(channel, command);
        });

        log.debug('RedisCommandBroker: Initialized.');
        cb(null, true);
    }

    /**
     * Shuts down the broker by closing the open connections to Redis.
     * @method shutdown
     * @param {Function} cb A callback that provides two parameters: cb(Error, Boolean)
     */
    shutdown(cb) {
        log.debug('RedisCommandBroker: Shutting down...');

        var clients = [this.subscribeClient, this.publishClient];
        for (var i = 0; i < clients.length; i++) {
            try {
                clients[i].quit();
            }
            catch (e) {
                log.silly('RedisCommandBroker: Error shutting down client: %s', e.stack);
            }
        }
        return Q.resolve(true);
    }

    /**
     * Called when a member of the cluster has published a command.  The function
     * inspects that it has a handler for the channel then delegates the command
     * back to the handler.
     * @method onCommandReceived
     * @param {String} channel The channel the message was pushed to
     * @param {String} commandStr The message that was published
     */
    onCommandReceived(channel, commandStr) {
        log.silly('RedisCommandBroker: Command received [%s]%s', channel, commandStr);

        if (SUBSCRIBERS[channel]) {
            try {
                SUBSCRIBERS[channel](channel, JSON.parse(commandStr));
            }
            catch (err) {
                log.error('RedisCommandHandler: An error occurred while attempting to handoff the command [%s]%s. %s', channel, commandStr, err.stack);
            }
        }
        else {
            log.warn('RedisCommandBroker: A message was received for channel [%s] but no handler was available to accept it.', channel);
        }
    }

    /**
     * Sends a message to the specified channel
     * @method publish
     * @param {String} channel The channel to send the message to
     * @param {Object} command The command to send to the cluster
     * @param {Function} cb A callback that takes two parameters: cb(Error, 1 on success/FALSE on failure)
     */
    publish(channel, command, cb) {
        if (!_.isObject(command)) {
            throw new Error('The channel string and command object are required!');
        }

        //send the command
        var commandStr = JSON.stringify(command);

        log.silly('RedisCommandBroker: Sending command [%s]%s', channel, commandStr);
        this.publishClient.publish(channel, commandStr, cb);
    }

    /**
     * Registers a handler for messages on the specified channel.
     * @method subscribe
     * @param {String} channel The channel to listen for messages on
     * @param {Function} onCommandReceived A handler function that takes two
     * arguments: onCommandReceived(channel, message) where channel is a string and
     * message is an object.
     * @param {Function} cb A callback that takes two parameters: cb(Error, [RESULT])
     */
    subscribe(channel, onCommandReceived, cb) {
        if (!ValidationService.isNonEmptyStr(channel, true) || !_.isFunction(onCommandReceived)) {
            return cb(new Error('A valid channel string and handler function is required'));
        }

        //setup the one time subscribe callback
        log.debug('RedisCommandBroker: Subcribing to channel [%s]', channel);
        this.subscribeClient.once('subscribe', function (subscribedChannel, count) {
            if (channel === subscribedChannel) {

                SUBSCRIBERS[channel] = onCommandReceived;
                cb(null, count);
            }
        });
        this.subscribeClient.subscribe(channel);
    }
}

//exports
module.exports = RedisCommandBroker;
