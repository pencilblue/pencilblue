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
var util    = require('../../util.js');
var process = require('process');
var domain  = require('domain');
var async   = require('async');

module.exports = function MongoCommandBrokerModule(pb) {

    /**
     * Brokers messages using Redis as the medium.  The implementation follows a
     * publish/subscribe model that allows for listening for changes based on a a
     * specified channel.
     * @class MongoCommandBroker
     * @constructor
     */
    function MongoCommandBroker(){

        /**
         * The cursor that trails the collection looking for new items
         * @property cursor
         * @type {Cursor}
         */
        this.cursor = null;
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
     * The collection that stores the commands
     * @private
     * @static
     * @property COMMAND_Q_COLL
     * @type {String}
     */
    var COMMAND_Q_COLL = 'command_queue';

    /**
     * The maximum size, in bytes, of the collection
     * @property DEFAULT_MAX_SIZE
     * @type {Integer}
     */
    var DEFAULT_MAX_SIZE = 10000;

    /**
     * Initializes the broker by creating the connections to Redis and registering
     * for the message event.
     * @method init
     * @param {Function} cb A callback that provides two parameters: cb(Error, Boolean)
     */
    MongoCommandBroker.prototype.init = function(cb) {

        this._verifyEntity(function(err, isInitialized) {
            if (isInitialized) {
                pb.log.debug('MongoCommandBroker: Initialized.');
            }
            cb(err, isInitialized);
        });
    };

    MongoCommandBroker.prototype._verifyEntity = function(cb) {
        var self = this;

        //check if the collection already exists
        var dao = new pb.DAO();
        dao.entityExists(COMMAND_Q_COLL, function(err, exists) {
            if (util.isError(err)) {
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
                size: pb.config.command.size || DEFAULT_MAX_SIZE
            };
            dao.createEntity(COMMAND_Q_COLL, options, function(err, result) {
                if (util.isError(err) || !result) {
                    return cb(err, false);
                }

                //Unfortunately, it turns out that MongoDB won’t keep a tailable 
                //cursor open if the collection is empty, so let’s also create a 
                //blank document to “prime” the collection.
                var primerCommand = {
                    type: "primer"
                };
                self.publish('primer', primerCommand, function(err, result) {
                    cb(err, result ? true : false);
                });
            });
        });
    };

    /**
     * Shuts down the broker by closing the open connections to Redis.
     * @method shutdown
     * @param {Function} cb A callback that provides two parameters: cb(Error, Boolean)
     */
    MongoCommandBroker.prototype.shutdown = function(cb) {
        pb.log.debug('MongoCommandBroker: Shutting down...');
        //TODO implement
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
    MongoCommandBroker.prototype.onCommandReceived = function(channel, command) {
        if (pb.log.isSilly()) {
            pb.log.silly('MongoCommandBroker: Command recieved [%s]%s', channel, JSON.stringify(command));
        }

        if (SUBSCRIBERS[channel]) {
            try{
                SUBSCRIBERS[channel](channel, command);
            }
            catch(err){
                pb.log.error('MongoCommandHandler: An error occurred while attempting to handoff the command [%s]%s. %s', channel, JSON.stringify(command), err.stack);
            }
        }
        else {
            pb.log.silly('MongoCommandBroker: A message was received for channel [%s] but no handler was available to accept it. This is most likely normal', channel);
        }
    };

    /**
     * Sends a message to the specified channel
     * @method publish
     * @param {String} channel The channel to send the message to
     * @param {Object} command The command to send to the cluster
     * @param {Function} cb A callback that takes two parameters: cb(Error, 1 on success/FALSE on failure)
     */
    MongoCommandBroker.prototype.publish = function(channel, command, cb) {
        if (!util.isObject(command)) {
            throw new Error('The channel string and command object are required!');
        }

        if (pb.log.isSilly()) {
            pb.log.silly('MongoCommandBroker: Sending command [%s]%s', channel, JSON.stringify(command));
        }

        //send command
        command.object_type = COMMAND_Q_COLL;
        command.channel     = channel;
        var dao = new pb.DAO();
        dao.save(command, function(err, result) {
            cb(err, result ? true : false);
        });
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
    MongoCommandBroker.prototype.subscribe = function(channel, onCommandReceived, cb) {
        if (!pb.validation.validateNonEmptyStr(channel, true) || !util.isFunction(onCommandReceived)) {
            cb(new Error('A valid channel string and handler function is required'));
            return;
        }

        //setup the one time subscribe callback
        pb.log.debug('MongoCommandBroker: Subcribing to channel [%s]', channel);


        //get a reference to the collection
        var self = this;
        var db = pb.dbm.getDb(function(err, db) {
            if (util.isError(err)) {
                return cb(err);
            }
            
            db.collection(COMMAND_Q_COLL, function(err, collection) {
                if (util.isError(err)) {
                    return cb(err);
                }


                //wrap it all up in a container so we can mitigate the crises that 
                //will inevitably ensue from dropped or timed out cursor connections.  
                //In addition, we put failure tolerances in place so that we can 
                //attempt to reconnect.
                var eot = new pb.ErrorsOverTime(5, 3000, 'MongoCommandBroker: ');
                var d   = domain.create();
                d.on('error', function(err) {
                    pb.log.error('MongoCommandBroker: An error occurred while waiting for commands: %s', err.stack || err.message);
                    pb.log.debug('MongoCommandBroker: Reconnecting to %s collection', COMMAND_Q_COLL);

                    //ensure we are still in bounds
                    eot.throwIfOutOfBounds(err);

                    //when we are still within the acceptable fault tolerance try 
                    //to reconnect
                    loop();
                });
                d.run(function() {
                    //process.nextTick(loop);
                    self.listen(null, collection);
                });

                SUBSCRIBERS[channel] = onCommandReceived;
                cb(null, true);
            });
        });
    };
    
    MongoCommandBroker.prototype.listen = function(latest, collection) {
        var self = this;
        
        this.latest(latest, collection, function(err, latest) {
//            if (util.isError(err)) {
//                pb.log.error('MongoBroker: %s', err.stack);
//                throw err;
//            }
            
            self._listen(latest, collection);
        });
    };
    
    MongoCommandBroker.prototype.latest = function(latest, collection, cb) {

        
        collection.find(latest ? { created: {$gt: new Date() }} : null)
        .sort({ $natural: -1 })
        .limit(1)
        .nextObject(function (err, doc) {
            if (err || doc) {
                return cb(err, doc);
            }

            collection.insert({ dummy: true, created: new Date() }, { dummy: true, created: new Date() }, function (err, docs) {
                cb(err, docs[0]);
            });
        });
    };
                        
    MongoCommandBroker.prototype._listen = function(latest, collection) {
        var self = this;
        
        //enter listen loop
        async.whilst(
            function() { return true; },
            getListener(collection, self, latest),
            function(err) {
                if (util.isError(err)) {
                    pb.log.error('MongoCommandBroker: %s\n%s', err.message, err.stack);
                }
                process.nextTick(function() {
                    self.listen(latest, collection);
                });
            }
        );
    };
    
    function getListener(collection, instance, latest) {
        return function(callback) {
            
            var query = { created: { $gte: new Date() }};
            var options = { tailable: true, awaitdata: true, numberOfRetries: Number.MAX_VALUE, tailableRetryInterval: 200 };
            var cursor = collection.find(query, options);
            
            var next = function() {
                
                cursor.nextObject(function(err, command) {
                    if (util.isError(err) || cursor.isClosed() || !util.isObject(command)) {
                        return callback(err);
                    }
                    else if (!command.dummy) {
                        //dispatch command
                        instance.onCommandReceived(command.channel, command);
                    }
                    else {
                        /* no op */
                    }
                    
                    //trigger wait for next object
                    process.nextTick(next);
                });
            };
            
            process.nextTick(next);
        };
    };

    //exports
    return MongoCommandBroker;
};
