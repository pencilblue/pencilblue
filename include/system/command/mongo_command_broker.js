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
const async   = require('async');
const Configuration = require('../../config');
const DAO = require('../../dao/dao');
const DbManager = require('../../dao/db_manager');
const domain  = require('domain');
const ErrorsOverTime = require('../../error/errors_over_time');
const log = require('../../utils/logging').newInstance('MongoCommandBroker');
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
 * @class MongoCommandBroker
 * @constructor
 */
class MongoCommandBroker {
    constructor() {

        /**
         * The cursor that trails the collection looking for new items
         * @property cursor
         * @type {Cursor}
         */
        this.cursor = null;
    }


    /**
     * The collection that stores the commands
     * @private
     * @static
     * @property COMMAND_Q_COLL
     * @type {String}
     */
    static get COMMAND_Q_COLL() {
        return 'command_queue';
    }

    /**
     * The maximum size, in bytes, of the collection
     * @property DEFAULT_MAX_SIZE
     * @type {Integer}
     */
    static get DEFAULT_MAX_SIZE() {
        return 10000;
    }

    /**
     * Initializes the broker by creating the connections to Redis and registering
     * for the message event.
     * @method init
     * @param {Function} cb A callback that provides two parameters: cb(Error, Boolean)
     */
    init(cb) {

        this._verifyEntity(function (err, isInitialized) {
            if (isInitialized) {
                log.debug('MongoCommandBroker: Initialized.');
            }
            cb(err, isInitialized);
        });
    }

    _verifyEntity(cb) {
        var self = this;

        //check if the collection already exists
        var dao = new DAO();
        dao.entityExists(MongoCommandBroker.COMMAND_Q_COLL, function (err, exists) {
            if (_.isError(err)) {
                return cb(err);
            }

            //when it exists we're done.  We'll assume that it was capped
            //appropriately & that it was seeded
            if (exists) {
                return cb(null, true);
            }

            //create the capped collection needed to store the commands
            var options = {
                capped: true,
                size: Configuration.active.command.size || MongoCommandBroker.DEFAULT_MAX_SIZE
            };
            dao.createEntity(MongoCommandBroker.COMMAND_Q_COLL, options, function (err, result) {
                if (_.isError(err) || !result) {
                    return cb(err, false);
                }

                //Unfortunately, it turns out that MongoDB won’t keep a tailable
                //cursor open if the collection is empty, so let’s also create a
                //blank document to “prime” the collection.
                var primerCommand = {
                    type: "primer"
                };
                self.publish('primer', primerCommand, function (err, result) {
                    cb(err, result ? true : false);
                });
            });
        });
    }

    /**
     * Shuts down the broker by closing the open connections to Redis.
     * @method shutdown
     * @param {Function} cb A callback that provides two parameters: cb(Error, Boolean)
     */
    shutdown(cb) {
        log.debug('MongoCommandBroker: Shutting down...');
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
    onCommandReceived(channel, command) {
        if (log.isSilly()) {
            log.silly('MongoCommandBroker: Command recieved [%s]%s', channel, JSON.stringify(command));
        }

        if (SUBSCRIBERS[channel]) {
            try {
                SUBSCRIBERS[channel](channel, command);
            }
            catch (err) {
                log.error('MongoCommandHandler: An error occurred while attempting to handoff the command [%s]%s. %s', channel, JSON.stringify(command), err.stack);
            }
        }
        else {
            log.silly('MongoCommandBroker: A message was received for channel [%s] but no handler was available to accept it. This is most likely normal', channel);
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

        if (log.isSilly()) {
            log.silly('MongoCommandBroker: Sending command [%s]%s', channel, JSON.stringify(command));
        }

        //send command
        command.object_type = MongoCommandBroker.COMMAND_Q_COLL;
        command.channel = channel;
        var dao = new DAO();
        dao.save(command, function (err, result) {
            cb(err, result ? true : false);
        });
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
        log.debug('MongoCommandBroker: Subscribing to channel [%s]', channel);


        //get a reference to the collection
        var self = this;
        DbManager.getDb(function (err, db) {
            if (_.isError(err)) {
                return cb(err);
            }

            db.collection(MongoCommandBroker.COMMAND_Q_COLL, function (err, collection) {
                if (_.isError(err)) {
                    return cb(err);
                }


                //wrap it all up in a container so we can mitigate the crises that
                //will inevitably ensue from dropped or timed out cursor connections.
                //In addition, we put failure tolerances in place so that we can
                //attempt to reconnect.
                var loop = function() {
                    self.listen(null, collection);
                };
                var eot = new ErrorsOverTime(5, 3000, 'MongoCommandBroker: ');
                var d = domain.create();
                d.on('error', function (err) {
                    log.error('MongoCommandBroker: An error occurred while waiting for commands: %s', err.stack || err.message);
                    log.debug('MongoCommandBroker: Reconnecting to %s collection', MongoCommandBroker.COMMAND_Q_COLL);

                    //ensure we are still in bounds
                    eot.throwIfOutOfBounds(err);

                    //when we are still within the acceptable fault tolerance try
                    //to reconnect
                    loop();
                });
                d.run(loop);

                SUBSCRIBERS[channel] = onCommandReceived;
                cb(null, true);
            });
        });
    }

    listen(latest, collection) {
        var self = this;

        this.latest(latest, collection, function (err, latest) {
//            if (_.isError(err)) {
//                log.error('MongoBroker: %s', err.stack);
//                throw err;
//            }

            self._listen(latest, collection);
        });
    }

    latest(latest, collection, cb) {


        collection.find(latest ? {created: {$gt: new Date()}} : null)
            .sort({$natural: -1})
            .limit(1)
            .nextObject(function (err, doc) {
                if (err || doc) {
                    return cb(err, doc);
                }

                collection.insert({dummy: true, created: new Date()}, {
                    dummy: true,
                    created: new Date()
                }, function (err, docs) {
                    cb(err, docs[0]);
                });
            });
    }

    _listen(latest, collection) {
        var self = this;

        //enter listen loop
        async.whilst(
            function () {
                return true;
            },
            getListener(collection, self, latest),
            function (err) {
                if (_.isError(err)) {
                    log.error('MongoCommandBroker: %s\n%s', err.message, err.stack);
                }
                process.nextTick(function () {
                    self.listen(latest, collection);
                });
            }
        );
    }
}

function getListener(collection, instance, latest) {
    return function(callback) {

        var query = { created: { $gte: new Date() }};
        var options = { tailable: true, awaitdata: true, numberOfRetries: Number.MAX_VALUE, tailableRetryInterval: 200 };
        var cursor = collection.find(query, options);

        var next = function () {

            cursor.nextObject(function(err, command) {
                if (_.isError(err) || cursor.isClosed() || !_.isObject(command)) {
                    return callback(err);
                }
                else if (!command.dummy) {
                    //dispatch command
                    instance.onCommandReceived(command.channel, command);
                }

                //trigger wait for next object
                process.nextTick(next);
            });
        };

        process.nextTick(next);
    };
}

//exports
module.exports = MongoCommandBroker;
