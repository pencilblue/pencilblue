'use strict';

//dependencies
var should = require('should');
var TestHelpers = require('../../test_helpers.js');

describe('AsyncEventEmitter', function() {

    TestHelpers.registerReset();

    describe('AsyncEventEmitter.extend', function() {

        ['on', 'once', 'removeListener', 'setMaxListeners', 'listeners', 'emit'].forEach(function(val) {
            it('should add the function '+val+' to the prototype', function() {
                var Prototype = function() {};
                this.pb.AsyncEventEmitter.extend(Prototype);
                Prototype[val].should.be.type('function');
            });
        });

        it('should emit an async event and wait for all listeners', function(done) {
            var Prototype = function() {};
            this.pb.AsyncEventEmitter.extend(Prototype);
            var data = {a: 1, b: 2};

            var cnt = 0;
            Prototype.on('do-it', function(context, callback) {
                context.should.eql(data);
                setTimeout(function() {
                    cnt++;
                    callback();
                }, 10);
            })
            .on('do-it', function(context, callback) {
                context.should.eql(data);
                setTimeout(function() {
                    cnt++;
                    callback();
                }, 15);
            })
            .emit('do-it', data, function(err) {
                (err === null).should.eql(true);
                cnt.should.eql(2);
                done();
            });
        });
    });
});
