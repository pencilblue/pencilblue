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
var util = require('../../util.js');

module.exports = function RedisCommandBrokerModule(pb) {

    /**
     * Brokers messages using Redis as the medium.  The implementation follows a
     * publish/subscribe model that allows for listening for changes based on a a
     * specified channel.
     * @class RedisCommandBroker
     * @constructor
     */
    function RedisCommandBroker(){

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
    };

    //statics
    /**
     * The hash of handlers for each channel subscribed to
     * @private
     * @static
     * @property SUBSCRIBERS
     * @type {Object}
     */
    var SUBSCRIBERS = {};

    /**
     * Initializes the broker by creating the connections to Redis and registering
     * for the message event.
     * @method init
     * @param {Function} cb A callback that provides two parameters: cb(Error, Boolean)
     */
    RedisCommandBroker.prototype.init = function(cb) {
        var self = this;

        this.publishClient   = pb.CacheFactory.getInstance();
        this.subscribeClient = pb.CacheFactory.createInstance();
        this.subscribeClient.on('message', function(channel, command) {
            self.onCommandReceived(channel, command);
        });

        pb.log.debug('RedisCommandBroker: Initialized.');
        cb(null, true);
    };

    /**
     * Shuts down the broker by closing the open connections to Redis.
     * @method shutdown
     * @param {Function} cb A callback that provides two parameters: cb(Error, Boolean)
     */
    RedisCommandBroker.prototype.shutdown = function(cb) {
        pb.log.debug('RedisCommandBroker: Shutting down...');

        var clients = [this.subscribeClient, this.publishClient, ];
        for (var i = 0; i < clients.length; i++) {
            try {
                clients[i].end();
            }
            catch(e) {
                pb.log.silly('RedisCommandBroker: Error shutting down client: %s', e.stack);
            }
        }
        cb(null, true);
    };

    /**
     * Called when a member of the cluster has published a command.  The function
     * inspects that it has a handler for the channel then delegates the command
     * back to the handler.
     * @method onCommandReceived
     * @param {String} channel The channel the message was pushed to
     * @param {String} commandStr The message that was published
     */
    RedisCommandBroker.prototype.onCommandReceived = function(channel, commandStr) {
        pb.log.silly('RedisCommandBroker: Command recieved [%s]%s', channel, commandStr);

        if (SUBSCRIBERS[channel]) {
            try{
                SUBSCRIBERS[channel](channel, JSON.parse(commandStr));
            }
            catch(err){
                pb.log.error('RedisCommandHandler: An error occurred while attempting to handoff the command [%s]%s. %s', channel, commandStr, err.stack);
            }
        }
        else {
            pb.log.warn('RedisCommandBroker: A message was received for channel [%s] but no handler was available to accept it.', channel);
        }
    };

    /**
     * Sends a message to the specified channel
     * @method publish
     * @param {String} channel The channel to send the message to
     * @param {Object} command The command to send to the cluster
     * @param {Function} cb A callback that takes two parameters: cb(Error, 1 on success/FALSE on failure)
     */
    RedisCommandBroker.prototype.publish = function(channel, command, cb) {
        if (!util.isObject(command)) {
            throw new Error('The channel string and command object are required!');
        }

        //send the command
        var commandStr = JSON.stringify(command);

        pb.log.silly('RedisCommandBroker: Sending command [%s]%s', channel, commandStr);
        this.publishClient.publish(channel, commandStr, cb);
    };

    /**
     * Registers a handler for messages on the specified channel.
     * @method subscribe
     * @param {String} channel The channel to listen for messages on
     * @param {Function} onCommandReceived A handler function that takes two
     * arguments: onCommandReceived(channel, message) where channel is a string and
     * message is an object.
     * @param {Function} cb A callback that takes two parameters: cb(Error, [RESULT])
     */
    RedisCommandBroker.prototype.subscribe = function(channel, onCommandReceived, cb) {
        if (!pb.validation.validateNonEmptyStr(channel, true) || !util.isFunction(onCommandReceived)) {
            cb(new Error('A valid channel string and handler function is required'));
            return;
        }

        //setup the one time subscribe callback
        pb.log.debug('RedisCommandBroker: Subcribing to channel [%s]', channel);
        this.subscribeClient.once('subscribe', function(subscribedChannel, count) {
            if (channel === subscribedChannel) {

                SUBSCRIBERS[channel] = onCommandReceived;
                cb(null, count);
            }
        });
        this.subscribeClient.subscribe(channel);
    };

    //exports
    return RedisCommandBroker;
};